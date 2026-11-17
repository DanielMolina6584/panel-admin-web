import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function Prueba({ onConfirmar = () => {} }: { onConfirmar?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button onClick={() => setAbierto(true)}>Abrir</button>
      <ConfirmDialog abierto={abierto} titulo="Deshabilitar la cuenta" confirmarTexto="Confirmar" onConfirmar={onConfirmar} onCancelar={() => setAbierto(false)}>
        <p>¿Seguro?</p>
      </ConfirmDialog>
    </>
  );
}

describe("ConfirmDialog", () => {
  it("atrapa el foco, cierra con Escape y devuelve el foco al botón que lo abrió", async () => {
    const user = userEvent.setup();
    render(<Prueba />);
    const abrir = screen.getByRole("button", { name: "Abrir" });
    await user.click(abrir);

    const dialogo = screen.getByRole("dialog", { name: "Deshabilitar la cuenta" });
    const cancelar = screen.getByRole("button", { name: "Cancelar" });
    const confirmar = screen.getByRole("button", { name: "Confirmar" });
    expect(cancelar).toHaveFocus();

    await user.tab();
    expect(confirmar).toHaveFocus();
    await user.tab(); // desde el último vuelve al primero: no se escapa del diálogo
    expect(cancelar).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirmar).toHaveFocus();
    expect(dialogo).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it("confirma la acción con el botón principal", async () => {
    const user = userEvent.setup();
    const onConfirmar = vi.fn();
    render(<Prueba onConfirmar={onConfirmar} />);
    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });
});
