import { adminAuth } from "./firebase-admin";
import { noAutenticado, prohibido } from "./errors";
import { verificarOrigen } from "./origen";
import { normalizarRol, type Rol } from "@/schemas/roles";

export const COOKIE_SESION = "sesion";
/** ~5 días (el máximo permitido por Firebase es 2 semanas). */
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;

export type UsuarioSesion = { uid: string; correo: string | null; rol: Rol };

type Decodificado = { uid: string; email?: string; rol?: unknown };

const aUsuario = (d: Decodificado): UsuarioSesion => ({
  uid: d.uid,
  correo: d.email ?? null,
  rol: normalizarRol(d.rol),
});

export function leerCookie(cabecera: string | null, nombre: string): string | null {
  if (!cabecera) return null;
  for (const parte of cabecera.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Verifica la cookie de sesión comprobando también la revocación y las cuentas deshabilitadas. */
export async function usuarioDesdeCookie(valor: string | undefined | null): Promise<UsuarioSesion | null> {
  if (!valor) return null;
  try {
    return aUsuario(await adminAuth().verifySessionCookie(valor, true));
  } catch {
    return null;
  }
}

/**
 * Autenticación de cada Route Handler. Acepta la cookie `sesion` o, para
 * probar con Bruno/Postman, `Authorization: Bearer <idToken>`.
 */
export async function requerirUsuario(request: Request): Promise<UsuarioSesion> {
  const cookie = leerCookie(request.headers.get("cookie"), COOKIE_SESION);
  if (cookie) {
    const usuario = await usuarioDesdeCookie(cookie);
    if (!usuario) throw noAutenticado();
    // La cookie viaja sola: las peticiones que modifican datos deben venir de nuestro sitio.
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) verificarOrigen(request, true);
    return usuario;
  }
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (bearer) {
    try {
      return aUsuario(await adminAuth().verifyIdToken(bearer, true));
    } catch {
      throw noAutenticado();
    }
  }
  throw noAutenticado();
}

export function requerirRol(usuario: UsuarioSesion, roles: readonly Rol[]): UsuarioSesion {
  if (!roles.includes(usuario.rol)) throw prohibido();
  return usuario;
}

export const requerirRolEnPeticion = async (request: Request, roles: readonly Rol[]) =>
  requerirRol(await requerirUsuario(request), roles);
