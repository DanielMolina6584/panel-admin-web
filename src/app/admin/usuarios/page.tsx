import { FiltrosUsuarios } from "@/components/FiltrosUsuarios";
import { Paginacion } from "@/components/Paginacion";
import { TablaUsuarios } from "@/components/TablaUsuarios";
import { requerirPagina } from "@/lib/sesion-servidor";
import { primero } from "@/lib/url";
import { listarUsuariosQuerySchema } from "@/schemas/usuarios";
import { listarUsuarios } from "@/services/usuarios";

export const metadata = { title: "Usuarios" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Usuarios({ searchParams }: Props) {
  await requerirPagina(["admin", "moderador"]);
  const crudo = await searchParams;
  const entrada = Object.fromEntries(
    ["q", "rol", "cursor", "limite", "orden", "dir"].flatMap((k) => (primero(crudo[k]) !== undefined ? [[k, primero(crudo[k])]] : [])),
  );
  const parseo = listarUsuariosQuerySchema.safeParse(entrada);
  const query = parseo.success ? parseo.data : listarUsuariosQuerySchema.parse({});
  const { items, siguienteCursor } = await listarUsuarios(query);
  const parametros = { q: query.q, rol: query.rol, orden: query.orden, dir: query.dir, cursor: query.cursor };

  return (
    <>
      <h1>Usuarios</h1>
      {!parseo.success && <p role="alert">Algunos filtros no eran válidos y se ignoraron.</p>}
      <FiltrosUsuarios q={query.q ?? ""} rol={query.rol ?? ""} orden={query.orden} dir={query.dir} />
      <p className="ayuda" role="status">
        {items.length} {items.length === 1 ? "resultado" : "resultados"} en esta página. El orden se aplica dentro de la página.
      </p>
      <TablaUsuarios items={items} parametros={parametros} orden={query.orden} dir={query.dir} />
      <Paginacion base="/admin/usuarios" parametros={parametros} siguienteCursor={siguienteCursor} />
    </>
  );
}
