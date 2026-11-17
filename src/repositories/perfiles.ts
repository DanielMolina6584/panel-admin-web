import { adminDb } from "@/lib/firebase-admin";
import type { Rol } from "@/schemas/roles";

export type Perfil = {
  nombre: string | null;
  correo: string | null;
  rol: Rol;
  deshabilitado: boolean;
  ultimoAcceso: string | null;
};

export type EntradaAuditoria = {
  actorUid: string;
  accion: string;
  objetivoUid: string | null;
  detalle: Record<string, string | number | boolean | null>;
};

/** Operaciones disponibles dentro de una transacción (lecturas primero, luego escrituras). */
export type Tx = {
  leerPerfil(uid: string): Promise<Perfil | null>;
  /** Administradores habilitados distintos de `excluirUid`. */
  otrosAdminsActivos(excluirUid: string): Promise<number>;
  guardarPerfil(uid: string, perfil: Partial<Perfil>): void;
  /** El registro de auditoría se escribe en la MISMA transacción que el cambio. */
  registrarAuditoria(entrada: EntradaAuditoria): void;
};

const refPerfil = (uid: string) => adminDb().doc(`usuarios/${uid}/perfil/datos`);

export async function ejecutarTransaccion<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const db = adminDb();
  return db.runTransaction(async (t) => {
    const tx: Tx = {
      async leerPerfil(uid) {
        const s = await t.get(refPerfil(uid));
        return s.exists ? (s.data() as Perfil) : null;
      },
      async otrosAdminsActivos(excluirUid) {
        const q = db
          .collectionGroup("perfil")
          .where("rol", "==", "admin")
          .where("deshabilitado", "==", false)
          .limit(3);
        const s = await t.get(q);
        return s.docs.filter((d) => d.ref.parent.parent?.id !== excluirUid).length;
      },
      guardarPerfil(uid, perfil) {
        t.set(refPerfil(uid), perfil, { merge: true });
      },
      registrarAuditoria(entrada) {
        t.create(db.collection("auditoria").doc(), { ...entrada, creadoEn: new Date().toISOString() });
      },
    };
    return fn(tx);
  });
}

export async function guardarAcceso(uid: string, datos: Omit<Perfil, "ultimoAcceso">) {
  await refPerfil(uid).set({ ...datos, ultimoAcceso: new Date().toISOString() }, { merge: true });
}

export async function obtenerVarios(uids: string[]): Promise<Map<string, Perfil>> {
  if (uids.length === 0) return new Map();
  const snaps = await adminDb().getAll(...uids.map(refPerfil));
  return new Map(snaps.filter((s) => s.exists).map((s) => [s.ref.parent.parent!.id, s.data() as Perfil]));
}
