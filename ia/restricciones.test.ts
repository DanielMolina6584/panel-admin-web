// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ajustes = JSON.parse(readFileSync(new URL("../.claude/settings.json", import.meta.url), "utf8"));
const deny: string[] = ajustes.permissions.deny;
const ask: string[] = ajustes.permissions.ask;

describe("Configuración de IA: restricciones de seguridad", () => {
  it("la IA no puede leer .env, claves ni credenciales", () => {
    for (const patron of ["Read(./.env)", "Read(./.env.*)", "Read(./**/*.pem)", "Read(./**/*serviceAccount*.json)", "Read(./**/*firebase-adminsdk*.json)"]) {
      expect(deny).toContain(patron);
    }
  });
  it("no puede escribir .env ni salir de la carpeta del proyecto", () => {
    expect(deny).toEqual(expect.arrayContaining(["Edit(./.env*)", "Write(./.env*)", "Edit(../**)", "Write(../**)", "Read(~/**)"]));
  });
  it("las acciones con efecto fuera de la máquina están bloqueadas o piden permiso", () => {
    expect(deny).toEqual(expect.arrayContaining(["Bash(git push*)", "Bash(vercel*)", "Bash(firebase deploy*)"]));
    expect(ask).toEqual(expect.arrayContaining(["Bash(curl*)", "Bash(git commit*)"]));
  });
});

describe("Configuración de IA: reglas y calidad automática", () => {
  it("existen las reglas del proyecto y la bitácora", () => {
    expect(readFileSync(new URL("../CLAUDE.md", import.meta.url), "utf8")).toMatch(/No leer ni imprimir `\.env\*`/);
    expect(readFileSync(new URL("../BITACORA-IA.md", import.meta.url), "utf8")).toMatch(/Propósito/);
  });
  it("ESLint prohíbe importar firebase/firestore en el cliente", () => {
    expect(readFileSync(new URL("../eslint.config.mjs", import.meta.url), "utf8")).toContain("firebase/firestore");
  });
  it(".env* está ignorado por Git (excepto .env.example)", () => {
    const git = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
    expect(git).toMatch(/^\.env\*$/m);
    expect(git).toMatch(/^!\.env\.example$/m);
  });
});

describe("Configuración de IA: calidad automática sobre lo que escriba la IA", () => {
  it("tras cada edición se ejecuta ESLint", () => {
    const hooks = ajustes.hooks.PostToolUse[0];
    expect(hooks.matcher).toMatch(/Edit/);
    expect(hooks.hooks[0].command).toContain("lint");
  });
});
