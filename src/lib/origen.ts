import { prohibido } from "./errors";

/**
 * Defensa CSRF: si hay cabecera Origin debe coincidir con el sitio.
 * Con `obligatorio`, su ausencia también se rechaza (peticiones con cookie).
 */
export function verificarOrigen(request: Request, obligatorio: boolean) {
  const origen = request.headers.get("origin");
  if (!origen) {
    if (obligatorio) throw prohibido("Origen no permitido");
    return;
  }
  const sitio = request.headers.get("host") ?? new URL(request.url).host;
  let host: string;
  try {
    host = new URL(origen).host;
  } catch {
    throw prohibido("Origen no permitido");
  }
  if (host !== sitio) throw prohibido("Origen no permitido");
}
