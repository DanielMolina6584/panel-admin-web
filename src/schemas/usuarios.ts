import { z } from "zod";
import { rolSchema } from "./roles";

/** Los parámetros de URL vacíos ("?q=") se tratan como ausentes. */
const textoOpcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const limiteSchema = z.preprocess(
  (v) => (v === undefined || v === "" ? undefined : Number(v)),
  z.number().int().min(1).max(100).default(20),
);

export const listarUsuariosQuerySchema = z.strictObject({
  q: textoOpcional(100),
  rol: z.preprocess((v) => (v === "" ? undefined : v), rolSchema.optional()),
  cursor: textoOpcional(2048),
  limite: limiteSchema,
  orden: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["correo", "creado", "acceso"]).default("correo"),
  ),
  dir: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["asc", "desc"]).default("asc"),
  ),
});
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;

export const cambiarRolSchema = z.strictObject({ rol: rolSchema });
export const cambiarEstadoSchema = z.strictObject({ deshabilitado: z.boolean() });

export const listarAuditoriaQuerySchema = z.strictObject({
  actorUid: textoOpcional(128),
  objetivoUid: textoOpcional(128),
  cursor: textoOpcional(256),
  limite: limiteSchema,
});
export type ListarAuditoriaQuery = z.infer<typeof listarAuditoriaQuerySchema>;

export const uidSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
