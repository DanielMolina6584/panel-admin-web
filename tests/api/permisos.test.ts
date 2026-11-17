// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { ctx, peticion } from "../sesiones";

vi.mock("@/lib/firebase-admin", async () => (await import("../sesiones")).moduloFalso);
vi.mock("@/services/usuarios", () => ({
  listarUsuarios: vi.fn(async () => ({ items: [], siguienteCursor: null })),
  obtenerUsuario: vi.fn(async () => ({ uid: "u-objetivo" })),
  cambiarRol: vi.fn(async () => undefined),
  cambiarEstado: vi.fn(async () => undefined),
  revocarSesiones: vi.fn(async () => undefined),
  listarAuditoria: vi.fn(async () => ({ items: [], siguienteCursor: null })),
  resumen: vi.fn(async () => ({})),
}));

import { GET as auditoria } from "@/app/api/admin/auditoria/route";
import { PATCH as estado } from "@/app/api/admin/usuarios/[uid]/estado/route";
import { POST as revocar } from "@/app/api/admin/usuarios/[uid]/revocar/route";
import { PATCH as rol } from "@/app/api/admin/usuarios/[uid]/rol/route";
import { GET as listar } from "@/app/api/admin/usuarios/route";
import { GET as yo } from "@/app/api/auth/yo/route";
import { obtenerUsuario } from "@/services/usuarios";
import { GET as detalle } from "@/app/api/admin/usuarios/[uid]/route";

type Quien = "cookie-admin" | "cookie-mod" | "cookie-user" | undefined;

const RUTAS = {
  "GET /usuarios": (q: Quien) => listar(peticion("GET", "/api/admin/usuarios", { cookie: q }), undefined),
  "GET /auditoria": (q: Quien) => auditoria(peticion("GET", "/api/admin/auditoria", { cookie: q }), undefined),
  "PATCH /rol": (q: Quien) => rol(peticion("PATCH", "/api/admin/usuarios/x/rol", { cookie: q, cuerpo: { rol: "moderador" } }), ctx()),
  "PATCH /estado": (q: Quien) => estado(peticion("PATCH", "/api/admin/usuarios/x/estado", { cookie: q, cuerpo: { deshabilitado: true } }), ctx()),
  "POST /revocar": (q: Quien) => revocar(peticion("POST", "/api/admin/usuarios/x/revocar", { cookie: q }), ctx()),
};

describe("tabla de permisos por rol y ruta", () => {
  it.each<[keyof typeof RUTAS, Quien, number]>([
    ["GET /usuarios", "cookie-admin", 200],
    ["GET /usuarios", "cookie-mod", 200],
    ["GET /usuarios", "cookie-user", 403],
    ["GET /auditoria", "cookie-admin", 200],
    ["GET /auditoria", "cookie-mod", 403],
    ["PATCH /rol", "cookie-admin", 204],
    ["PATCH /rol", "cookie-mod", 403],
    ["PATCH /rol", "cookie-user", 403],
    ["PATCH /estado", "cookie-mod", 403],
    ["POST /revocar", "cookie-mod", 403],
    ["POST /revocar", "cookie-admin", 204],
    ["PATCH /rol", undefined, 401],
  ])("%s como %s → %i", async (ruta, quien, esperado) => {
    expect((await RUTAS[ruta](quien)).status).toBe(esperado);
  });
});

describe("autenticación (401)", () => {
  it("sin credenciales", async () => {
    const r = await yo(peticion("GET", "/api/auth/yo"), undefined);
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Sesión requerida" });
  });
  it("cookie revocada o inválida", async () => {
    expect((await yo(peticion("GET", "/api/auth/yo", { cookie: "invalida" }), undefined)).status).toBe(401);
  });
  it("devuelve uid, correo y rol con una sesión válida", async () => {
    const r = await yo(peticion("GET", "/api/auth/yo", { cookie: "cookie-mod" }), undefined);
    expect(await r.json()).toEqual({ usuario: { uid: "m1", correo: "mod@ejemplo.co", rol: "moderador" } });
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect(r.headers.get("X-Request-Id")).toBeTruthy();
  });
});

describe("validación (400) y errores consistentes", () => {
  it("rechaza un rol desconocido con detalle por campo", async () => {
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/x/rol", { cookie: "cookie-admin", cuerpo: { rol: "superadmin" } }), ctx());
    expect(r.status).toBe(400);
    const cuerpo = await r.json();
    expect(cuerpo.error).toBeTruthy();
    expect(cuerpo.detalles[0].campo).toBe("rol");
  });
  it("rechaza campos desconocidos (mass assignment)", async () => {
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/x/rol", { cookie: "cookie-admin", cuerpo: { rol: "admin", uid: "otro" } }), ctx());
    expect(r.status).toBe(400);
  });
  it("rechaza JSON roto y tipos de contenido no permitidos", async () => {
    const mala = new Request("http://localhost/api/admin/usuarios/x/rol", {
      method: "PATCH",
      headers: { cookie: "sesion=cookie-admin", origin: "http://localhost", "content-type": "application/json" },
      body: "{no es json",
    });
    expect((await rol(mala, ctx())).status).toBe(400);
    const texto = new Request("http://localhost/api/admin/usuarios/x/rol", {
      method: "PATCH",
      headers: { cookie: "sesion=cookie-admin", origin: "http://localhost", "content-type": "text/plain" },
      body: "x",
    });
    expect((await rol(texto, ctx())).status).toBe(415);
  });
  it("valida los parámetros de la consulta", async () => {
    const r = await listar(peticion("GET", "/api/admin/usuarios?limite=500", { cookie: "cookie-admin" }), undefined);
    expect(r.status).toBe(400);
  });
});

describe("autorización por objeto y CSRF", () => {
  it("devuelve 404 si el usuario no existe", async () => {
    vi.mocked(obtenerUsuario).mockRejectedValueOnce(Object.assign(new Error("x"), { code: "auth/user-not-found" }));
    const r = await detalle(peticion("GET", "/api/admin/usuarios/nadie", { cookie: "cookie-admin" }), ctx("nadie"));
    expect(r.status).toBe(404);
  });
  it("rechaza un uid con caracteres raros", async () => {
    const r = await detalle(peticion("GET", "/api/admin/usuarios/a%2Fb", { cookie: "cookie-admin" }), ctx("a/b"));
    expect(r.status).toBe(400);
  });
  it("rechaza escrituras con cookie desde otro origen (403)", async () => {
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/x/rol", { cookie: "cookie-admin", cuerpo: { rol: "usuario" }, origen: "https://malo.example" }), ctx());
    expect(r.status).toBe(403);
  });
  it("rechaza escrituras con cookie sin cabecera Origin (403)", async () => {
    const r = await rol(peticion("PATCH", "/api/admin/usuarios/x/rol", { cookie: "cookie-admin", cuerpo: { rol: "usuario" }, origen: null }), ctx());
    expect(r.status).toBe(403);
  });
});
