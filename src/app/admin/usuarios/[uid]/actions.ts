"use server";

import { revalidatePath } from "next/cache";
import { ErrorHttp } from "@/lib/errors";
import { limitar } from "@/lib/rate-limit";
import { usuarioActual } from "@/lib/sesion-servidor";
import { rolSchema } from "@/schemas/roles";
import { uidSchema } from "@/schemas/usuarios";
import { cambiarEstado, cambiarRol, revocarSesiones } from "@/services/usuarios";

export type Resultado = { ok: true } | { ok: false; error: string };

/**
 * Capa 3 (acciones): cada Server Action vuelve a verificar la sesión y el rol;
 * nunca se confía en que el proxy o la página ya lo hicieran.
 */
async function ejecutar(uid: string, accion: (actorUid: string, uid: string) => Promise<void>): Promise<Resultado> {
  try {
    const actor = await usuarioActual();
    if (!actor) return { ok: false, error: "Su sesión expiró. Inicie sesión de nuevo." };
    if (actor.rol !== "admin") return { ok: false, error: "No tiene permiso para esta acción." };
    limitar(`escritura:${actor.uid}`, 30, 60_000);
    const id = uidSchema.parse(uid);
    await accion(actor.uid, id);
    revalidatePath(`/admin/usuarios/${id}`);
    revalidatePath("/admin/auditoria");
    return { ok: true };
  } catch (e) {
    if (e instanceof ErrorHttp) return { ok: false, error: e.message };
    return { ok: false, error: "No se pudo completar la acción." };
  }
}

export async function cambiarRolAccion(uid: string, rol: string) {
  const r = rolSchema.safeParse(rol);
  if (!r.success) return { ok: false, error: "Rol no válido." } satisfies Resultado;
  return ejecutar(uid, (actorUid, id) => cambiarRol({ uid: actorUid }, id, r.data));
}

export async function cambiarEstadoAccion(uid: string, deshabilitado: boolean) {
  return ejecutar(uid, (actorUid, id) => cambiarEstado({ uid: actorUid }, id, deshabilitado === true));
}

export async function revocarSesionesAccion(uid: string) {
  return ejecutar(uid, (actorUid, id) => revocarSesiones({ uid: actorUid }, id));
}
