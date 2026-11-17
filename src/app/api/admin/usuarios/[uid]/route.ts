import { requerirRolEnPeticion } from "@/lib/auth";
import { type Contexto, manejar } from "@/lib/http";
import { uidSchema } from "@/schemas/usuarios";
import { obtenerUsuario } from "@/services/usuarios";

export const runtime = "nodejs";

export const GET = manejar(async (request, { params }: Contexto<{ uid: string }>) => {
  await requerirRolEnPeticion(request, ["admin", "moderador"]);
  const uid = uidSchema.parse((await params).uid);
  return Response.json({ usuario: await obtenerUsuario(uid) });
});
