import { COOKIE_SESION, DURACION_SESION_MS, leerCookie, usuarioDesdeCookie } from "@/lib/auth";
import { noAutenticado } from "@/lib/errors";
import { adminAuth } from "@/lib/firebase-admin";
import { cookieSesion, leerJson, manejar, sinContenido } from "@/lib/http";
import { verificarOrigen } from "@/lib/origen";
import { ipDe, limitar } from "@/lib/rate-limit";
import { normalizarRol } from "@/schemas/roles";
import { sesionSchema } from "@/schemas/auth";
import { registrarAcceso } from "@/services/usuarios";

export const runtime = "nodejs";

const MAX_ANTIGUEDAD_LOGIN_S = 5 * 60;

export const POST = manejar(async (request) => {
  verificarOrigen(request, false);
  limitar(`sesion:${ipDe(request)}`, 10, 60_000);
  const { idToken } = await leerJson(request, sesionSchema);

  const auth = adminAuth();
  const decodificado = await auth.verifyIdToken(idToken, true);
  // Solo se acepta un inicio de sesión reciente para crear la cookie.
  if (Date.now() / 1000 - decodificado.auth_time > MAX_ANTIGUEDAD_LOGIN_S) {
    throw noAutenticado("Inicie sesión de nuevo");
  }

  const cookie = await auth.createSessionCookie(idToken, { expiresIn: DURACION_SESION_MS });
  await registrarAcceso({
    uid: decodificado.uid,
    correo: decodificado.email ?? null,
    nombre: typeof decodificado.name === "string" ? decodificado.name : null,
    rol: normalizarRol(decodificado.rol),
  });

  const respuesta = sinContenido();
  respuesta.headers.append("Set-Cookie", cookieSesion(cookie, DURACION_SESION_MS / 1000));
  return respuesta;
});

export const DELETE = manejar(async (request) => {
  verificarOrigen(request, false);
  const usuario = await usuarioDesdeCookie(leerCookie(request.headers.get("cookie"), COOKIE_SESION));
  if (usuario) await adminAuth().revokeRefreshTokens(usuario.uid);
  const respuesta = sinContenido();
  respuesta.headers.append("Set-Cookie", cookieSesion("", 0));
  return respuesta;
});
