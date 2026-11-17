/** Registro por petición: solo método, ruta (sin query) y estado. Nunca tokens, contraseñas ni datos personales. */
export function registrarPeticion(datos: {
  id: string;
  metodo: string;
  ruta: string;
  estado: number;
  ms: number;
}) {
  console.info(JSON.stringify({ nivel: "info", ...datos }));
}

export function registrarError(id: string, error: unknown) {
  const codigo =
    typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : undefined;
  const nombre = error instanceof Error ? error.name : typeof error;
  console.error(JSON.stringify({ nivel: "error", id, nombre, codigo }));
}
