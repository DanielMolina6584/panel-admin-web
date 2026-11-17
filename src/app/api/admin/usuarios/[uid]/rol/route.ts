import { requerirRolEnPeticion } from "@/lib/auth";
import { type Contexto, leerJson, manejar, sinContenido } from "@/lib/http";
import { limitar } from "@/lib/rate-limit";
import { cambiarRolSchema, uidSchema } from "@/schemas/usuarios";
import { cambiarRol } from "@/services/usuarios";

export const runtime = "nodejs";

export const PATCH = manejar(async (request, { params }: Contexto<{ uid: string }>) => {
  const actor = await requerirRolEnPeticion(request, ["admin"]);
  limitar(`escritura:${actor.uid}`, 30, 60_000);
  const uid = uidSchema.parse((await params).uid);
  const { rol } = await leerJson(request, cambiarRolSchema);
  await cambiarRol(actor, uid, rol);
  return sinContenido();
});
