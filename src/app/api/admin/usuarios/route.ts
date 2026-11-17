import { requerirRolEnPeticion } from "@/lib/auth";
import { leerQuery, manejar } from "@/lib/http";
import { listarUsuariosQuerySchema } from "@/schemas/usuarios";
import { listarUsuarios } from "@/services/usuarios";

export const runtime = "nodejs";

export const GET = manejar(async (request) => {
  await requerirRolEnPeticion(request, ["admin", "moderador"]);
  const query = leerQuery(request, listarUsuariosQuerySchema);
  return Response.json(await listarUsuarios(query));
});
