"use client";

import { useState } from "react";

export type FilaCsv = Record<string, string>;

/** Neutraliza fórmulas de hoja de cálculo (=, +, -, @) y escapa comillas. */
export function aCsv(filas: FilaCsv[], columnas: string[]): string {
  const celda = (v: string) => {
    const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  return [columnas.map(celda).join(","), ...filas.map((f) => columnas.map((c) => celda(f[c] ?? "")).join(","))].join("\r\n");
}

export function ExportarCsv({ filas, columnas, nombre }: { filas: FilaCsv[]; columnas: string[]; nombre: string }) {
  const [aviso, setAviso] = useState("");

  async function exportar() {
    const csv = aCsv(filas, columnas);
    if (typeof Blob !== "undefined" && typeof URL !== "undefined" && "createObjectURL" in URL) {
      const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
      setAviso("Archivo CSV generado.");
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(csv);
      setAviso("Su navegador no permite descargar: el CSV se copió al portapapeles.");
    } else {
      setAviso("Su navegador no permite exportar.");
    }
  }

  return (
    <div>
      <button type="button" className="boton boton--secundario" onClick={exportar} disabled={filas.length === 0}>
        Exportar esta página a CSV
      </button>
      <p role="status" aria-live="polite" className="ayuda">
        {aviso}
      </p>
    </div>
  );
}
