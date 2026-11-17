import { requerirRolEnPeticion } from "@/lib/auth";
import { manejar } from "@/lib/http";
import { resumen } from "@/services/usuarios";

export const runtime = "nodejs";

export const GET = manejar(async (request) => {
  await requerirRolEnPeticion(request, ["admin", "moderador"]);
  return Response.json(await resumen());
});
