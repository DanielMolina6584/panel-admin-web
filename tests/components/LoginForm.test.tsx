import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { entrar } = vi.hoisted(() => ({ entrar: vi.fn() }));
vi.mock("firebase/auth", () => ({ signInWithEmailAndPassword: entrar, signOut: vi.fn() }));
vi.mock("@/lib/firebase-client", () => ({ authCliente: () => ({}) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import { LoginForm } from "@/components/LoginForm";

describe("LoginForm", () => {
  it("asocia etiquetas y muestra errores de validación junto al campo", async () => {
    const user = userEvent.setup();
    render(<LoginForm destino="/admin" />);
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    const correo = screen.getByLabelText("Correo electrónico");
    expect(correo).toBeInvalid();
    expect(correo).toHaveAccessibleDescription(/correo válido/i);
    expect(screen.getByLabelText("Contraseña")).toHaveAccessibleDescription(/mínimo 6/i);
    expect(entrar).not.toHaveBeenCalled();
  });

  it("anuncia el error de credenciales sin revelar cuál campo falló", async () => {
    const user = userEvent.setup();
    entrar.mockRejectedValueOnce({ code: "auth/invalid-credential" });
    render(<LoginForm destino="/admin" />);
    await user.type(screen.getByLabelText("Correo electrónico"), "a@ejemplo.co");
    await user.type(screen.getByLabelText("Contraseña"), "secreto1");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
  });
});
