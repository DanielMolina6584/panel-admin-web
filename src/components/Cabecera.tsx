"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authCliente } from "@/lib/firebase-client";
import { ETIQUETA_ROL } from "@/schemas/roles";
import { useSesion } from "./SesionProvider";

const ENLACES = [
  { href: "/admin", texto: "Resumen", roles: ["admin", "moderador"] },
  { href: "/admin/usuarios", texto: "Usuarios", roles: ["admin", "moderador"] },
  { href: "/admin/auditoria", texto: "Auditoría", roles: ["admin"] },
] as const;

export function Cabecera() {
  const usuario = useSesion();
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      await fetch("/api/auth/sesion", { method: "DELETE" });
      await authCliente().signOut();
    } finally {
      router.replace("/login");
      router.refresh();
      setSaliendo(false);
    }
  }

  return (
    <header className="cabecera">
      <div className="cabecera__fila">
        <Link href="/admin" className="cabecera__marca">
          Panel de administración
        </Link>
        {usuario && (
          <button
            type="button"
            className="boton boton--secundario cabecera__menu"
            aria-expanded={abierto}
            aria-controls="nav-principal"
            onClick={() => setAbierto((a) => !a)}
          >
            Menú
          </button>
        )}
      </div>
      {usuario && (
        <div id="nav-principal" className="cabecera__panel" data-abierto={abierto}>
          <nav aria-label="Principal">
            <ul className="nav">
              {ENLACES.filter((e) => (e.roles as readonly string[]).includes(usuario.rol)).map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    aria-current={ruta === e.href || (e.href !== "/admin" && ruta.startsWith(e.href)) ? "page" : undefined}
                    onClick={() => setAbierto(false)}
                  >
                    {e.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="cabecera__usuario">
            <span>
              {usuario.correo ?? usuario.uid} · {ETIQUETA_ROL[usuario.rol]}
            </span>
            <button type="button" className="boton boton--secundario" onClick={cerrarSesion} disabled={saliendo}>
              {saliendo ? "Saliendo…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
