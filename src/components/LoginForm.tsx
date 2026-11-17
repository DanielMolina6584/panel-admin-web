"use client";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authCliente } from "@/lib/firebase-client";
import { loginSchema } from "@/schemas/auth";

type Errores = Partial<Record<"correo" | "contrasena" | "general", string>>;

function mensajeDe(error: unknown): string {
  const codigo = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(codigo)) {
    return "Correo o contraseña incorrectos.";
  }
  if (codigo === "auth/user-disabled") return "Esta cuenta está deshabilitada.";
  if (codigo === "auth/too-many-requests") return "Demasiados intentos. Espere unos minutos.";
  return "No se pudo iniciar sesión. Intente de nuevo.";
}

export function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [errores, setErrores] = useState<Errores>({});
  const [pendiente, setPendiente] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const r = loginSchema.safeParse({ correo: datos.get("correo"), contrasena: datos.get("contrasena") });
    if (!r.success) {
      const nuevos: Errores = {};
      for (const i of r.error.issues) nuevos[i.path[0] as "correo" | "contrasena"] ??= i.message;
      setErrores(nuevos);
      return;
    }
    setErrores({});
    setPendiente(true);
    try {
      const auth = authCliente();
      const cred = await signInWithEmailAndPassword(auth, r.data.correo, r.data.contrasena);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      await signOut(auth); // el navegador solo conserva la cookie HttpOnly
      if (!res.ok) throw new Error("sesion");
      router.replace(destino);
      router.refresh();
    } catch (err) {
      setErrores({ general: mensajeDe(err) });
      setPendiente(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="formulario" aria-describedby={errores.general ? "error-general" : undefined}>
      <div className="campo">
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="username"
          required
          aria-invalid={errores.correo ? true : undefined}
          aria-describedby={errores.correo ? "error-correo" : undefined}
        />
        {errores.correo && (
          <p id="error-correo" className="campo__error">
            {errores.correo}
          </p>
        )}
      </div>
      <div className="campo">
        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errores.contrasena ? true : undefined}
          aria-describedby={errores.contrasena ? "error-contrasena" : undefined}
        />
        {errores.contrasena && (
          <p id="error-contrasena" className="campo__error">
            {errores.contrasena}
          </p>
        )}
      </div>
      <div role="alert" id="error-general">
        {errores.general && <p className="campo__error">{errores.general}</p>}
      </div>
      <button type="submit" className="boton" disabled={pendiente}>
        {pendiente ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
