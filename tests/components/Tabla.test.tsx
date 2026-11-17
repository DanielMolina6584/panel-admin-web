import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { aCsv } from "@/components/ExportarCsv";
import { TablaUsuarios } from "@/components/TablaUsuarios";

const usuario = {
  uid: "u1", correo: "ana@ejemplo.co", nombre: "Ana", rol: "moderador" as const, deshabilitado: true,
  creadoEn: "2026-01-02T10:00:00.000Z", ultimoAcceso: null, ultimoRefresco: null, tokensValidosDesde: null,
};

describe("TablaUsuarios", () => {
  it("muestra el estado vacío cuando no hay resultados", () => {
    render(<TablaUsuarios items={[]} parametros={{}} orden="correo" dir="asc" />);
    expect(screen.getByRole("status")).toHaveTextContent(/no hay usuarios/i);
  });

  it("expone orden, encabezados y estado con texto (no solo color)", () => {
    render(<TablaUsuarios items={[usuario]} parametros={{}} orden="correo" dir="asc" />);
    expect(screen.getByRole("columnheader", { name: /correo/i })).toHaveAttribute("aria-sort", "ascending");
    const fila = screen.getByRole("row", { name: /ana@ejemplo.co/i });
    expect(within(fila).getByText("Deshabilitada")).toBeInTheDocument();
    expect(within(fila).getByRole("link", { name: "ana@ejemplo.co" })).toHaveAttribute("href", "/admin/usuarios/u1");
  });
});

describe("aCsv", () => {
  it("neutraliza fórmulas y escapa comillas", () => {
    const csv = aCsv([{ a: '=HYPERLINK("x")', b: 'dijo "hola"' }], ["a", "b"]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"dijo ""hola"""');
  });
});
