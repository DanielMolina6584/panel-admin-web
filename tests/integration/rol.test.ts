// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ctx, peticion } from "../sesiones";

vi.mock("@/lib/firebase-admin", async () => (await import("../sesiones")).moduloFalso);

const { tx, authRepo } = vi.hoisted(() => ({
  tx: {
    leerPerfil: vi.fn(),
    otrosAdminsActivos: vi.fn(),
    guardarPerfil: vi.fn(),
    registrarAuditoria: vi.fn(),
  },
  authRepo: {
    obtener: vi.fn(),
    listar: vi.fn(),
    asignarRol: vi.fn(),
    fijarDeshabilitado: vi.fn(),
    revocarTokens: vi.fn(),
  },
}));
vi.mock("@/repositories/perfiles", () => ({
  ejecutarTransaccion: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  guardarAcceso: vi.fn(),
  obtenerVarios: vi.fn(async () => new Map()),
}));
vi.mock("@/repositories/usuarios-auth", () => authRepo);
vi.mock("@/repositories/auditoria", () => ({ listar: vi.fn() }));

import { PATCH as rol } from "@/app/api/admin/usuarios/[uid]/rol/route";
import { PATCH as estado } from "@/app/api/admin/usuarios/[uid]/estado/route";

const adminObjetivo = { uid: "u-objetivo", correo: "t@ejemplo.co", nombre: null, rol: "admin", deshabilitado: false };

beforeEach(() => {
  vi.clearAllMocks();
  authRepo.obtener.mockResolvedValue(adminObjetivo);
});

describe("ruta → servicio → repositorio", () => {
  it("quitar el último admin devuelve 409 y no cambia nada", async () => {
    tx.otrosAdminsActivos.mockResolvedValue(0);
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/u-objetivo/rol", { cookie: "cookie-admin", cuerpo: { rol: "usuario" } }), ctx());
    expect(r.status).toBe(409);
    expect(tx.registrarAuditoria).not.toHaveBeenCalled();
    expect(authRepo.asignarRol).not.toHaveBeenCalled();
  });

  it("un admin no puede quitarse el último rol admin a sí mismo", async () => {
    authRepo.obtener.mockResolvedValue({ ...adminObjetivo, uid: "a1" });
    tx.otrosAdminsActivos.mockResolvedValue(0);
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/a1/rol", { cookie: "cookie-admin", cuerpo: { rol: "moderador" } }), ctx("a1"));
    expect(r.status).toBe(409);
  });

  it("con otro admin disponible cambia el rol, audita con el uid del actor y revoca sesiones", async () => {
    tx.otrosAdminsActivos.mockResolvedValue(1);
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/u-objetivo/rol", { cookie: "cookie-admin", cuerpo: { rol: "moderador" } }), ctx());
    expect(r.status).toBe(204);
    expect(tx.registrarAuditoria).toHaveBeenCalledWith({
      actorUid: "a1",
      accion: "usuario.rol.cambiar",
      objetivoUid: "u-objetivo",
      detalle: { rolAnterior: "admin", rolNuevo: "moderador" },
    });
    expect(tx.guardarPerfil).toHaveBeenCalledWith("u-objetivo", expect.objectContaining({ rol: "moderador" }));
    expect(authRepo.asignarRol).toHaveBeenCalledWith("u-objetivo", "moderador");
    expect(authRepo.revocarTokens).toHaveBeenCalledWith("u-objetivo");
  });

  it("no deja deshabilitar al último administrador ni la propia cuenta", async () => {
    tx.otrosAdminsActivos.mockResolvedValue(0);
    const ultimo = await estado(peticion("PATCH", "/api/admin/usuarios/u-objetivo/estado", { cookie: "cookie-admin", cuerpo: { deshabilitado: true } }), ctx());
    expect(ultimo.status).toBe(409);
    const propia = await estado(peticion("PATCH", "/api/admin/usuarios/a1/estado", { cookie: "cookie-admin", cuerpo: { deshabilitado: true } }), ctx("a1"));
    expect(propia.status).toBe(409);
    expect(authRepo.fijarDeshabilitado).not.toHaveBeenCalled();
  });
});
