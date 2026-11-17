"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { construirUrl } from "@/lib/url";
import { ETIQUETA_ROL, ROLES } from "@/schemas/roles";

type Props = { q: string; rol: string; orden: string; dir: string };

/** Es un <form method="get"> real (funciona sin JavaScript); con JS la búsqueda se aplica sola. */
export function FiltrosUsuarios({ q, rol, orden, dir }: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState(q);
  const [rolSel, setRolSel] = useState(rol);
  const retrasado = useDebounce(texto, 400);
  const inicial = useRef({ q, rol });

  useEffect(() => {
    if (retrasado === inicial.current.q && rolSel === inicial.current.rol) return;
    inicial.current = { q: retrasado, rol: rolSel };
    router.replace(construirUrl("/admin/usuarios", { q: retrasado, rol: rolSel, orden, dir }));
  }, [retrasado, rolSel, orden, dir, router]);

  return (
    <form method="get" action="/admin/usuarios" role="search" aria-label="Filtrar usuarios" className="filtros">
      <div className="campo">
        <label htmlFor="q">Buscar por correo o nombre</label>
        <input id="q" name="q" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={100} />
      </div>
      <div className="campo">
        <label htmlFor="rol">Rol</label>
        <select id="rol" name="rol" value={rolSel} onChange={(e) => setRolSel(e.target.value)}>
          <option value="">Todos</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ETIQUETA_ROL[r]}
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name="orden" value={orden} />
      <input type="hidden" name="dir" value={dir} />
      <button type="submit" className="boton">
        Buscar
      </button>
    </form>
  );
}
