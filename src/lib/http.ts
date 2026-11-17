import { ZodError, type ZodType } from "zod";
import { ErrorHttp, type DetalleError } from "./errors";
import { registrarError, registrarPeticion } from "./logger";

const MAX_CUERPO = 16 * 1024;

type Manejador<C> = (request: Request, contexto: C) => Promise<Response>;

const CODIGOS_401 = new Set([
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
  "auth/user-disabled",
  "auth/argument-error",
]);

function detallesDe(error: ZodError): DetalleError[] {
  return error.issues.map((i) => ({ campo: i.path.join(".") || "(cuerpo)", mensaje: i.message }));
}

export function errorARespuesta(error: unknown, id: string): Response {
  if (error instanceof ErrorHttp) {
    return Response.json(
      { error: error.message, ...(error.detalles && { detalles: error.detalles }) },
      { status: error.status, headers: error.cabeceras },
    );
  }
  if (error instanceof ZodError) {
    return Response.json({ error: "Datos no válidos", detalles: detallesDe(error) }, { status: 400 });
  }
  const codigo = typeof error === "object" && error && "code" in error ? (error as { code: unknown }).code : null;
  if (typeof codigo === "string" && CODIGOS_401.has(codigo)) {
    return Response.json({ error: "Sesión no válida" }, { status: 401 });
  }
  if (codigo === "auth/user-not-found") return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (codigo === 6 || codigo === "already-exists") {
    return Response.json({ error: "El recurso ya existe" }, { status: 409 });
  }
  registrarError(id, error);
  return Response.json({ error: "Error interno" }, { status: 500 });
}

/** Envoltorio común: errores consistentes, id de petición, `no-store` y registro sin datos sensibles. */
export function manejar<C = unknown>(manejador: Manejador<C>): Manejador<C> {
  return async (request, contexto) => {
    const id = crypto.randomUUID();
    const inicio = Date.now();
    let respuesta: Response;
    try {
      respuesta = await manejador(request, contexto);
    } catch (error) {
      respuesta = errorARespuesta(error, id);
    }
    respuesta.headers.set("X-Request-Id", id);
    if (!respuesta.headers.has("Cache-Control")) respuesta.headers.set("Cache-Control", "no-store");
    registrarPeticion({
      id,
      metodo: request.method,
      ruta: new URL(request.url).pathname,
      estado: respuesta.status,
      ms: Date.now() - inicio,
    });
    return respuesta;
  };
}

export async function leerJson<T>(request: Request, esquema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ErrorHttp(415, "Use Content-Type: application/json");
  }
  const texto = await request.text();
  if (texto.length > MAX_CUERPO) throw new ErrorHttp(413, "Cuerpo demasiado grande");
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorHttp(400, "JSON no válido");
  }
  return esquema.parse(datos);
}

export function leerQuery<T>(request: Request, esquema: ZodType<T>): T {
  return esquema.parse(Object.fromEntries(new URL(request.url).searchParams));
}

export const sinContenido = () => new Response(null, { status: 204 });

export type Contexto<P extends Record<string, string>> = { params: Promise<P> };

export function cookieSesion(valor: string, maxAgeS: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `sesion=${encodeURIComponent(valor)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAgeS}`;
}
