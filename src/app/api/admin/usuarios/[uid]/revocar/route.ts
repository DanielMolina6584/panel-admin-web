import { requerirRolEnPeticion } from "@/lib/auth";
import { type Contexto, manejar, sinContenido } from "@/lib/http";
import { limitar } from "@/lib/rate-limit";
import { uidSchema } from "@/schemas/usuarios";
import { revocarSesiones } from "@/services/usuarios";

export const runtime = "nodejs";

export const POST = manejar(async (request, { params }: Contexto<{ uid: string }>) => {
  const actor = await requerirRolEnPeticion(request, ["admin"]);
  limitar(`escritura:${actor.uid}`, 30, 60_000);
  const uid = uidSchema.parse((await params).uid);
  await revocarSesiones(actor, uid);
  return sinContenido();
});
