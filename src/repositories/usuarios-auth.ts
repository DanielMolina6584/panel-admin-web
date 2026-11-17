import { adminAuth } from "@/lib/firebase-admin";
import { normalizarRol, type Rol } from "@/schemas/roles";
import type { UserRecord } from "firebase-admin/auth";

export type UsuarioAuth = {
  uid: string;
  correo: string | null;
  nombre: string | null;
  rol: Rol;
  deshabilitado: boolean;
  creadoEn: string | null;
  ultimoAcceso: string | null;
  ultimoRefresco: string | null;
  tokensValidosDesde: string | null;
};

const iso = (v: string | undefined | null) => (v ? new Date(v).toISOString() : null);

function mapear(u: UserRecord): UsuarioAuth {
  return {
    uid: u.uid,
    correo: u.email ?? null,
    nombre: u.displayName ?? null,
    rol: normalizarRol(u.customClaims?.rol),
    deshabilitado: u.disabled,
    creadoEn: iso(u.metadata.creationTime),
    ultimoAcceso: iso(u.metadata.lastSignInTime),
    ultimoRefresco: iso(u.metadata.lastRefreshTime),
    tokensValidosDesde: iso(u.tokensValidAfterTime),
  };
}

/** Lanza un error `auth/user-not-found` (→ 404) si el uid no existe. */
export async function obtener(uid: string): Promise<UsuarioAuth> {
  return mapear(await adminAuth().getUser(uid));
}

export async function listar(pageToken: string | undefined, maximo = 1000) {
  const pagina = await adminAuth().listUsers(maximo, pageToken);
  return { usuarios: pagina.users.map(mapear), siguiente: pagina.pageToken ?? null };
}

export const asignarRol = (uid: string, rol: Rol) => adminAuth().setCustomUserClaims(uid, { rol });
export const fijarDeshabilitado = (uid: string, deshabilitado: boolean) =>
  adminAuth().updateUser(uid, { disabled: deshabilitado }).then(() => undefined);
export const revocarTokens = (uid: string) => adminAuth().revokeRefreshTokens(uid);
