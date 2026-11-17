import { notFound } from "next/navigation";
import { AccionesUsuario } from "@/components/AccionesUsuario";
import { requerirPagina } from "@/lib/sesion-servidor";
import { formatearFecha } from "@/lib/url";
import { ETIQUETA_ROL } from "@/schemas/roles";
import { uidSchema } from "@/schemas/usuarios";
import { listarAuditoria, obtenerUsuario } from "@/services/usuarios";

export const metadata = { title: "Detalle de usuario" };

export default async function DetalleUsuario({ params }: { params: Promise<{ uid: string }> }) {
  const actor = await requerirPagina(["admin", "moderador"]);
  const uid = uidSchema.safeParse((await params).uid);
  if (!uid.success) notFound();

  const usuario = await obtenerUsuario(uid.data).catch((e: { code?: string }) => {
    if (e?.code === "auth/user-not-found") notFound();
    throw e;
  });
  const historial = actor.rol === "admin" ? (await listarAuditoria({ objetivoUid: usuario.uid, limite: 10 })).items : [];

  return (
    <>
      <h1>{usuario.correo ?? usuario.uid}</h1>
      <dl className="detalle tarjeta">
        <div><dt>Nombre</dt><dd>{usuario.nombre ?? "—"}</dd></div>
        <div><dt>Rol</dt><dd>{ETIQUETA_ROL[usuario.rol]}</dd></div>
        <div><dt>Estado</dt><dd>{usuario.deshabilitado ? "Deshabilitada" : "Activa"}</dd></div>
        <div><dt>Creada</dt><dd>{formatearFecha(usuario.creadoEn)}</dd></div>
        <div><dt>Último acceso</dt><dd>{formatearFecha(usuario.ultimoAcceso)}</dd></div>
        <div><dt>Sesiones válidas desde</dt><dd>{formatearFecha(usuario.tokensValidosDesde)}</dd></div>
      </dl>

      {actor.rol === "admin" ? (
        <AccionesUsuario uid={usuario.uid} rolActual={usuario.rol} deshabilitado={usuario.deshabilitado} esUnoMismo={actor.uid === usuario.uid} />
      ) : (
        <p className="ayuda">Su rol de moderador es de solo lectura.</p>
      )}

      {actor.rol === "admin" && (
        <section aria-labelledby="t-hist">
          <h2 id="t-hist">Historial</h2>
          {historial.length === 0 ? (
            <p className="vacio">Sin acciones registradas sobre este usuario.</p>
          ) : (
            <ul className="lista">
              {historial.map((r) => (
                <li key={r.id}>
                  <strong>{r.accion}</strong> · <time dateTime={r.creadoEn}>{formatearFecha(r.creadoEn)}</time> · por {r.actorUid}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
