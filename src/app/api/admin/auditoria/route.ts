import { requerirRolEnPeticion } from "@/lib/auth";
import { leerQuery, manejar } from "@/lib/http";
import { listarAuditoriaQuerySchema } from "@/schemas/usuarios";
import { listarAuditoria } from "@/services/usuarios";

export const runtime = "nodejs";

export const GET = manejar(async (request) => {
  await requerirRolEnPeticion(request, ["admin"]);
  const query = leerQuery(request, listarAuditoriaQuerySchema);
  return Response.json(await listarAuditoria(query));
});
