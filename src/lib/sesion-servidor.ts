import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, usuarioDesdeCookie, type UsuarioSesion } from "./auth";
import type { Rol } from "@/schemas/roles";

/** Usuario de la petición actual (una sola verificación por render). */
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> =>
  usuarioDesdeCookie((await cookies()).get(COOKIE_SESION)?.value),
);

/** Segunda capa de autorización (Server Components): el proxy solo mira si existe la cookie. */
export async function requerirPagina(roles: readonly Rol[]): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (!roles.includes(usuario.rol)) redirect("/sin-permiso");
  return usuario;
}
