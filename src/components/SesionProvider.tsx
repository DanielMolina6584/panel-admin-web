"use client";

import { createContext, useContext } from "react";
import type { UsuarioSesion } from "@/lib/auth";

const Contexto = createContext<UsuarioSesion | null>(null);

export function SesionProvider({ usuario, children }: { usuario: UsuarioSesion | null; children: React.ReactNode }) {
  return <Contexto.Provider value={usuario}>{children}</Contexto.Provider>;
}

export const useSesion = () => useContext(Contexto);
