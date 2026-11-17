"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  abierto: boolean;
  titulo: string;
  children: React.ReactNode;
  confirmarTexto: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  ocupado?: boolean;
};

const FOCUSABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Confirmación accesible con <dialog>: atrapa el foco, Escape cancela y el foco
 * vuelve al botón que la abrió. Sin <dialog> en el navegador usa `confirm()`.
 */
export function ConfirmDialog({ abierto, titulo, children, confirmarTexto, onConfirmar, onCancelar, ocupado }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (!abierto) return;
    if (typeof HTMLDialogElement === "undefined") {
      if (window.confirm(titulo)) onConfirmar();
      else onCancelar();
      return;
    }
    const d = ref.current;
    if (!d) return;
    previo.current = document.activeElement as HTMLElement | null;
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    d.querySelector<HTMLElement>("[data-inicial]")?.focus();
    return () => {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
      previo.current?.focus();
    };
    // Solo debe reaccionar a abrir/cerrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  function alTeclear(e: React.KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!ocupado) onCancelar();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLES));
    if (items.length === 0) return;
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  return (
    <dialog ref={ref} className="dialogo" aria-labelledby={idTitulo} onKeyDown={alTeclear} onCancel={(e) => e.preventDefault()}>
      <h2 id={idTitulo} className="dialogo__titulo">
        {titulo}
      </h2>
      <div>{children}</div>
      <div className="dialogo__acciones">
        <button type="button" className="boton boton--secundario" data-inicial onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </button>
        <button type="button" className="boton boton--peligro" onClick={onConfirmar} disabled={ocupado}>
          {ocupado ? "Procesando…" : confirmarTexto}
        </button>
      </div>
    </dialog>
  );
}
