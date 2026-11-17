import Link from "next/link";
import type { UsuarioAdmin } from "@/services/usuarios";
import { construirUrl, formatearFecha, type Parametros } from "@/lib/url";
import { ETIQUETA_ROL } from "@/schemas/roles";

type Props = { items: UsuarioAdmin[]; parametros: Parametros; orden: string; dir: string };

const COLUMNAS = [
  { clave: "correo", texto: "Correo" },
  { clave: "creado", texto: "Creado" },
  { clave: "acceso", texto: "Último acceso" },
] as const;

export function TablaUsuarios({ items, parametros, orden, dir }: Props) {
  if (items.length === 0) {
    return (
      <p className="vacio" role="status">
        No hay usuarios que coincidan con la búsqueda.
      </p>
    );
  }
  const sentido = (clave: string) => (orden === clave ? (dir === "asc" ? "ascending" : "descending") : "none");
  return (
    <div className="tabla-contenedor" tabIndex={0} role="region" aria-label="Tabla de usuarios">
      <table className="tabla">
        <caption className="solo-lectores">Usuarios de la plataforma</caption>
        <thead>
          <tr>
            {COLUMNAS.slice(0, 1).map((c) => (
              <th key={c.clave} scope="col" aria-sort={sentido(c.clave)}>
                <Link href={construirUrl("/admin/usuarios", { ...parametros, cursor: undefined, orden: c.clave, dir: orden === c.clave && dir === "asc" ? "desc" : "asc" })}>
                  {c.texto} {orden === c.clave ? (dir === "asc" ? "▲" : "▼") : ""}
                </Link>
              </th>
            ))}
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            {COLUMNAS.slice(1).map((c) => (
              <th key={c.clave} scope="col" aria-sort={sentido(c.clave)}>
                <Link href={construirUrl("/admin/usuarios", { ...parametros, cursor: undefined, orden: c.clave, dir: orden === c.clave && dir === "asc" ? "desc" : "asc" })}>
                  {c.texto} {orden === c.clave ? (dir === "asc" ? "▲" : "▼") : ""}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.uid}>
              <th scope="row">
                <Link href={`/admin/usuarios/${u.uid}`}>{u.correo ?? u.uid}</Link>
                {u.nombre && <span className="tabla__sub">{u.nombre}</span>}
              </th>
              <td>{ETIQUETA_ROL[u.rol]}</td>
              <td>
                <span className={u.deshabilitado ? "insignia insignia--off" : "insignia"}>
                  {u.deshabilitado ? "Deshabilitada" : "Activa"}
                </span>
              </td>
              <td>
                <time dateTime={u.creadoEn ?? undefined}>{formatearFecha(u.creadoEn)}</time>
              </td>
              <td>
                <time dateTime={u.ultimoAcceso ?? undefined}>{formatearFecha(u.ultimoAcceso)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
