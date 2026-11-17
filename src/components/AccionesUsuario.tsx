"use client";

import { useState, useTransition } from "react";
import { ETIQUETA_ROL, ROLES, type Rol } from "@/schemas/roles";
import { cambiarEstadoAccion, cambiarRolAccion, revocarSesionesAccion } from "@/app/admin/usuarios/[uid]/actions";
import { ConfirmDialog } from "./ConfirmDialog";

type Pendiente = "rol" | "estado" | "revocar" | null;
type Props = { uid: string; rolActual: Rol; deshabilitado: boolean; esUnoMismo: boolean };

export function AccionesUsuario({ uid, rolActual, deshabilitado, esUnoMismo }: Props) {
  const [rol, setRol] = useState<Rol>(rolActual);
  const [pendiente, setPendiente] = useState<Pendiente>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, iniciar] = useTransition();

  function confirmar() {
    const tipo = pendiente;
    iniciar(async () => {
      const r =
        tipo === "rol"
          ? await cambiarRolAccion(uid, rol)
          : tipo === "estado"
            ? await cambiarEstadoAccion(uid, !deshabilitado)
            : await revocarSesionesAccion(uid);
      setPendiente(null);
      setMensaje(
        r.ok
          ? { ok: true, texto: "Cambio aplicado y registrado en la auditoría." }
          : { ok: false, texto: r.error },
      );
    });
  }

  return (
    <div className="acciones">
      <div role="status" aria-live="polite" className="acciones__estado">
        {mensaje && <p className={mensaje.ok ? "aviso aviso--ok" : "aviso aviso--error"}>{mensaje.ok ? "Hecho. " : "Error. "}{mensaje.texto}</p>}
      </div>

      <form
        className="tarjeta"
        onSubmit={(e) => {
          e.preventDefault();
          if (rol !== rolActual) setPendiente("rol");
        }}
      >
        <fieldset>
          <legend>Rol</legend>
          {ROLES.map((r) => (
            <label key={r} className="opcion">
              <input type="radio" name="rol" value={r} checked={rol === r} onChange={() => setRol(r)} />
              {ETIQUETA_ROL[r]}
            </label>
          ))}
        </fieldset>
        <p className="ayuda">
          El nuevo rol se aplica cuando el usuario renueva su token. Al cambiarlo se cierran sus sesiones abiertas
          para que el efecto sea inmediato.
        </p>
        <button type="submit" className="boton" disabled={rol === rolActual}>
          Guardar rol
        </button>
      </form>

      <section className="tarjeta" aria-labelledby="t-cuenta">
        <h2 id="t-cuenta">Cuenta y sesiones</h2>
        <div className="acciones__botones">
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => setPendiente("estado")}
            disabled={deshabilitado ? false : esUnoMismo}
          >
            {deshabilitado ? "Habilitar cuenta" : "Deshabilitar cuenta"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => setPendiente("revocar")}>
            Cerrar todas sus sesiones
          </button>
        </div>
        {esUnoMismo && <p className="ayuda">No puede deshabilitar su propia cuenta.</p>}
      </section>

      <ConfirmDialog
        abierto={pendiente !== null}
        titulo={
          pendiente === "rol"
            ? `Cambiar el rol a ${ETIQUETA_ROL[rol]}`
            : pendiente === "estado"
              ? deshabilitado
                ? "Habilitar la cuenta"
                : "Deshabilitar la cuenta"
              : "Cerrar todas las sesiones"
        }
        confirmarTexto="Confirmar"
        ocupado={ocupado}
        onConfirmar={confirmar}
        onCancelar={() => {
          setPendiente(null);
          if (pendiente === "rol") setRol(rolActual);
        }}
      >
        <p>Esta acción quedará registrada en la auditoría. ¿Desea continuar?</p>
      </ConfirmDialog>
    </div>
  );
}
