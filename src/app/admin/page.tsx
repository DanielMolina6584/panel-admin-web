import Link from "next/link";
import { requerirPagina } from "@/lib/sesion-servidor";
import { formatearFecha } from "@/lib/url";
import { ETIQUETA_ROL, ROLES } from "@/schemas/roles";
import { resumen } from "@/services/usuarios";

export const metadata = { title: "Resumen" };

export default async function Resumen() {
  const usuario = await requerirPagina(["admin", "moderador"]);
  const datos = await resumen();
  return (
    <>
      <h1>Resumen</h1>
      <dl className="metricas">
        <div className="tarjeta">
          <dt>Usuarios</dt>
          <dd>{datos.total}</dd>
        </div>
        {ROLES.map((r) => (
          <div className="tarjeta" key={r}>
            <dt>{ETIQUETA_ROL[r]}</dt>
            <dd>{datos.porRol[r]}</dd>
          </div>
        ))}
        <div className="tarjeta">
          <dt>Deshabilitados</dt>
          <dd>{datos.deshabilitados}</dd>
        </div>
      </dl>
      {datos.truncado && <p className="ayuda">Conteo sobre las primeras 5 000 cuentas.</p>}

      {usuario.rol === "admin" && (
        <section aria-labelledby="t-recientes">
          <h2 id="t-recientes">Actividad reciente</h2>
          {datos.recientes.length === 0 ? (
            <p className="vacio">Aún no hay acciones registradas.</p>
          ) : (
            <ul className="lista">
              {datos.recientes.map((r) => (
                <li key={r.id}>
                  <strong>{r.accion}</strong> · <time dateTime={r.creadoEn}>{formatearFecha(r.creadoEn)}</time>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/auditoria">Ver toda la auditoría</Link>
        </section>
      )}
    </>
  );
}
