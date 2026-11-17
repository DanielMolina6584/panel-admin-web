import { z } from "zod";

export const ROLES = ["usuario", "moderador", "admin"] as const;
export const rolSchema = z.enum(ROLES);
export type Rol = z.infer<typeof rolSchema>;

export const ETIQUETA_ROL: Record<Rol, string> = {
  usuario: "Usuario",
  moderador: "Moderador",
  admin: "Administrador",
};

/** Lee el claim `rol`; cualquier valor desconocido se trata como el rol sin privilegios. */
export function normalizarRol(valor: unknown): Rol {
  const r = rolSchema.safeParse(valor);
  return r.success ? r.data : "usuario";
}
