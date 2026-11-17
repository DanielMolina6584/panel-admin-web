import { adminDb } from "@/lib/firebase-admin";
import { ErrorHttp } from "@/lib/errors";

export type RegistroAuditoria = {
  id: string;
  actorUid: string;
  accion: string;
  objetivoUid: string | null;
  detalle: Record<string, unknown>;
  creadoEn: string;
};

export type FiltrosAuditoria = { actorUid?: string; objetivoUid?: string; cursor?: string; limite: number };

/** Paginación por cursor (id del último documento). Cada filtro usa su índice compuesto. */
export async function listar(f: FiltrosAuditoria) {
  const col = adminDb().collection("auditoria");
  let q = col.orderBy("creadoEn", "desc");
  if (f.actorUid) q = col.where("actorUid", "==", f.actorUid).orderBy("creadoEn", "desc");
  else if (f.objetivoUid) q = col.where("objetivoUid", "==", f.objetivoUid).orderBy("creadoEn", "desc");
  if (f.cursor) {
    const ancla = await col.doc(f.cursor).get();
    if (!ancla.exists) throw new ErrorHttp(400, "Cursor no válido");
    q = q.startAfter(ancla);
  }
  const snap = await q.limit(f.limite + 1).get();
  const docs = snap.docs.slice(0, f.limite);
  const items = docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RegistroAuditoria, "id">) }));
  return { items, siguienteCursor: snap.docs.length > f.limite ? docs[docs.length - 1].id : null };
}
