import { z } from "zod";

export const sesionSchema = z.strictObject({ idToken: z.string().min(20).max(4096) });

/** Mismo esquema en el formulario (cliente) y para validar entradas antes de llamar a Firebase. */
export const loginSchema = z.strictObject({
  correo: z.email("Escriba un correo válido").max(254),
  contrasena: z.string().min(6, "Mínimo 6 caracteres").max(256),
});
export type LoginDatos = z.infer<typeof loginSchema>;
