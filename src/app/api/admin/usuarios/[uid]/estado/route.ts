import { requerirRolEnPeticion } from "@/lib/auth";
import { type Contexto, leerJson, manejar, sinContenido } from "@/lib/http";
import { limitar } from "@/lib/rate-limit";
import { cambiarEstadoSchema, uidSchema } from "@/schemas/usuarios";
import { cambiarEstado } from "@/services/usuarios";

export const runtime = "nodejs";

export const PATCH = manejar(async (request, { params }: Contexto<{ uid: string }>) => {
  const actor = await requerirRolEnPeticion(request, ["admin"]);
  limitar(`escritura:${actor.uid}`, 30, 60_000);
  const uid = uidSchema.parse((await params).uid);
  const { deshabilitado } = await leerJson(request, cambiarEstadoSchema);
  await cambiarEstado(actor, uid, deshabilitado);
  return sinContenido();
});
