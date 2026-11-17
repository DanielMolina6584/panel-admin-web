import { conflicto } from "@/lib/errors";
import * as auditoria from "@/repositories/auditoria";
import * as perfiles from "@/repositories/perfiles";
import * as authRepo from "@/repositories/usuarios-auth";
import type { Rol } from "@/schemas/roles";
import type { ListarAuditoriaQuery, ListarUsuariosQuery } from "@/schemas/usuarios";

export type UsuarioAdmin = authRepo.UsuarioAuth;
export type Actor = { uid: string };

type Cursor = { t: string | null; i: number };

const codificar = (c: Cursor) => Buffer.from(JSON.stringify(c)).toString("base64url");
function decodificar(valor: string | undefined): Cursor {
  if (!valor) return { t: null, i: 0 };
  try {
    const c = JSON.parse(Buffer.from(valor, "base64url").toString());
    if ((c.t === null || typeof c.t === "string") && Number.isInteger(c.i) && c.i >= 0) return c;
  } catch {
    /* cursor corrupto: se ignora y se empieza de nuevo */
  }
  return { t: null, i: 0 };
}

const coincide = (u: UsuarioAdmin, q?: string, rol?: Rol) =>
  (!rol || u.rol === rol) &&
  (!q || `${u.correo ?? ""} ${u.nombre ?? ""}`.toLowerCase().includes(q.toLowerCase()));

const clave: Record<ListarUsuariosQuery["orden"], (u: UsuarioAdmin) => string> = {
  correo: (u) => u.correo ?? "",
  creado: (u) => u.creadoEn ?? "",
  acceso: (u) => u.ultimoAcceso ?? "",
};

/** Lista con búsqueda y filtro por rol; el orden se aplica dentro de la página devuelta. */
export async function listarUsuarios(query: ListarUsuariosQuery) {
  const cursor = decodificar(query.cursor);
  let token = cursor.t ?? undefined;
  let desde = cursor.i;
  const items: UsuarioAdmin[] = [];
  let siguienteCursor: string | null = null;

  paginas: for (let n = 0; n < 5; n++) {
    const pagina = await authRepo.listar(token);
    for (let k = desde; k < pagina.usuarios.length; k++) {
      if (!coincide(pagina.usuarios[k], query.q, query.rol)) continue;
      if (items.length === query.limite) {
        siguienteCursor = codificar({ t: token ?? null, i: k });
        break paginas;
      }
      items.push(pagina.usuarios[k]);
    }
    if (!pagina.siguiente) break;
    token = pagina.siguiente;
    desde = 0;
    if (n === 4) siguienteCursor = codificar({ t: token, i: 0 });
  }

  const extra = await perfiles.obtenerVarios(items.map((u) => u.uid));
  const conPerfil = items.map((u) => ({
    ...u,
    nombre: u.nombre ?? extra.get(u.uid)?.nombre ?? null,
    ultimoAcceso: extra.get(u.uid)?.ultimoAcceso ?? u.ultimoAcceso,
  }));
  const f = clave[query.orden];
  conPerfil.sort((a, b) => f(a).localeCompare(f(b)) * (query.dir === "desc" ? -1 : 1));
  return { items: conPerfil, siguienteCursor };
}

export const obtenerUsuario = (uid: string) => authRepo.obtener(uid);

export async function cambiarRol(actor: Actor, uid: string, rol: Rol) {
  const objetivo = await authRepo.obtener(uid);
  if (objetivo.rol === rol) throw conflicto("El usuario ya tiene ese rol");

  await perfiles.ejecutarTransaccion(async (tx) => {
    const eraAdminActivo = objetivo.rol === "admin" && !objetivo.deshabilitado;
    if (eraAdminActivo && (await tx.otrosAdminsActivos(uid)) === 0) {
      throw conflicto("No puede quitar el rol al último administrador");
    }
    tx.guardarPerfil(uid, { nombre: objetivo.nombre, correo: objetivo.correo, rol, deshabilitado: objetivo.deshabilitado });
    tx.registrarAuditoria({
      actorUid: actor.uid,
      accion: "usuario.rol.cambiar",
      objetivoUid: uid,
      detalle: { rolAnterior: objetivo.rol, rolNuevo: rol },
    });
  });

  await authRepo.asignarRol(uid, rol);
  // El claim solo se aplica al renovar el token: se revocan las sesiones para que sea inmediato.
  await authRepo.revocarTokens(uid);
}

export async function cambiarEstado(actor: Actor, uid: string, deshabilitado: boolean) {
  if (deshabilitado && actor.uid === uid) throw conflicto("No puede deshabilitar su propia cuenta");
  const objetivo = await authRepo.obtener(uid);
  if (objetivo.deshabilitado === deshabilitado) {
    throw conflicto(deshabilitado ? "La cuenta ya está deshabilitada" : "La cuenta ya está habilitada");
  }

  await perfiles.ejecutarTransaccion(async (tx) => {
    if (deshabilitado && objetivo.rol === "admin" && (await tx.otrosAdminsActivos(uid)) === 0) {
      throw conflicto("No puede deshabilitar al último administrador");
    }
    tx.guardarPerfil(uid, { nombre: objetivo.nombre, correo: objetivo.correo, rol: objetivo.rol, deshabilitado });
    tx.registrarAuditoria({
      actorUid: actor.uid,
      accion: deshabilitado ? "usuario.deshabilitar" : "usuario.habilitar",
      objetivoUid: uid,
      detalle: {},
    });
  });

  await authRepo.fijarDeshabilitado(uid, deshabilitado);
  if (deshabilitado) await authRepo.revocarTokens(uid);
}

export async function revocarSesiones(actor: Actor, uid: string) {
  await authRepo.obtener(uid);
  await perfiles.ejecutarTransaccion(async (tx) => {
    tx.registrarAuditoria({ actorUid: actor.uid, accion: "usuario.sesiones.revocar", objetivoUid: uid, detalle: {} });
  });
  await authRepo.revocarTokens(uid);
}

export const listarAuditoria = (q: ListarAuditoriaQuery) => auditoria.listar(q);

export async function registrarAcceso(u: { uid: string; correo: string | null; nombre: string | null; rol: Rol }) {
  await perfiles.guardarAcceso(u.uid, { nombre: u.nombre, correo: u.correo, rol: u.rol, deshabilitado: false });
}

/** Totales sobre las primeras 5 000 cuentas (Auth no ofrece un conteo directo). */
export async function resumen() {
  const porRol: Record<Rol, number> = { usuario: 0, moderador: 0, admin: 0 };
  let total = 0;
  let deshabilitados = 0;
  let token: string | undefined;
  let truncado = false;
  for (let n = 0; n < 5; n++) {
    const pagina = await authRepo.listar(token);
    for (const u of pagina.usuarios) {
      total += 1;
      porRol[u.rol] += 1;
      if (u.deshabilitado) deshabilitados += 1;
    }
    if (!pagina.siguiente) break;
    token = pagina.siguiente;
    if (n === 4) truncado = true;
  }
  const { items: recientes } = await auditoria.listar({ limite: 5 });
  return { total, deshabilitados, porRol, truncado, recientes };
}
