import { ExportarCsv } from "@/components/ExportarCsv";
import { Paginacion } from "@/components/Paginacion";
import { requerirPagina } from "@/lib/sesion-servidor";
import { formatearFecha, primero } from "@/lib/url";
import { listarAuditoriaQuerySchema } from "@/schemas/usuarios";
import { listarAuditoria } from "@/services/usuarios";

export const metadata = { title: "Auditoría" };

export default async function Auditoria({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requerirPagina(["admin"]);
  const crudo = await searchParams;
  const entrada = Object.fromEntries(
    ["actorUid", "cursor"].flatMap((k) => (primero(crudo[k]) !== undefined ? [[k, primero(crudo[k])]] : [])),
  );
  const parseo = listarAuditoriaQuerySchema.safeParse(entrada);
  const query = parseo.success ? parseo.data : listarAuditoriaQuerySchema.parse({});
  const { items, siguienteCursor } = await listarAuditoria(query);

  const filasCsv = items.map((r) => ({
    fecha: r.creadoEn,
    actor: r.actorUid,
    accion: r.accion,
    objetivo: r.objetivoUid ?? "",
    detalle: JSON.stringify(r.detalle),
  }));

  return (
    <>
      <h1>Registro de auditoría</h1>
      <form method="get" action="/admin/auditoria" role="search" aria-label="Filtrar auditoría" className="filtros">
        <div className="campo">
          <label htmlFor="actorUid">UID del actor</label>
          <input id="actorUid" name="actorUid" defaultValue={query.actorUid ?? ""} maxLength={128} />
        </div>
        <button type="submit" className="boton">Filtrar</button>
      </form>
      <ExportarCsv filas={filasCsv} columnas={["fecha", "actor", "accion", "objetivo", "detalle"]} nombre="auditoria.csv" />
      {items.length === 0 ? (
        <p className="vacio" role="status">No hay registros que coincidan.</p>
      ) : (
        <div className="tabla-contenedor" tabIndex={0} role="region" aria-label="Tabla de auditoría">
          <table className="tabla">
            <caption className="solo-lectores">Acciones administrativas, de la más reciente a la más antigua</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Actor</th>
                <th scope="col">Acción</th>
                <th scope="col">Objetivo</th>
                <th scope="col">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td><time dateTime={r.creadoEn}>{formatearFecha(r.creadoEn)}</time></td>
                  <td className="tabla__mono">{r.actorUid}</td>
                  <td>{r.accion}</td>
                  <td className="tabla__mono">{r.objetivoUid ?? "—"}</td>
                  <td className="tabla__mono">{JSON.stringify(r.detalle)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion base="/admin/auditoria" parametros={{ actorUid: query.actorUid, cursor: query.cursor }} siguienteCursor={siguienteCursor} />
    </>
  );
}
