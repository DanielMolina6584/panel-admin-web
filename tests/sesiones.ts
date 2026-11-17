import { vi } from "vitest";

export const USUARIOS = {
  "cookie-admin": { uid: "a1", email: "admin@ejemplo.co", rol: "admin" },
  "cookie-mod": { uid: "m1", email: "mod@ejemplo.co", rol: "moderador" },
  "cookie-user": { uid: "u1", email: "user@ejemplo.co", rol: "usuario" },
} as const;

export const auth = {
  verifySessionCookie: vi.fn(async (valor: string) => {
    const u = USUARIOS[valor as keyof typeof USUARIOS];
    if (!u) throw Object.assign(new Error("revocada"), { code: "auth/session-cookie-revoked" });
    return u;
  }),
  verifyIdToken: vi.fn(),
};

/** Sustituto de `@/lib/firebase-admin`: ninguna prueba toca Firebase de verdad. */
export const moduloFalso = {
  adminAuth: () => auth,
  adminDb: () => {
    throw new Error("Firestore no debe usarse directamente en las pruebas");
  },
};

export const peticion = (
  metodo: string,
  ruta: string,
  { cookie, cuerpo, origen = "http://localhost" }: { cookie?: keyof typeof USUARIOS | "invalida"; cuerpo?: unknown; origen?: string | null } = {},
) => {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = `sesion=${cookie === "invalida" ? "x" : cookie}`;
  if (cuerpo !== undefined) headers["content-type"] = "application/json";
  if (metodo !== "GET" && origen) headers.origin = origen;
  return new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
};

export const ctx = (uid = "u-objetivo") => ({ params: Promise.resolve({ uid }) });
