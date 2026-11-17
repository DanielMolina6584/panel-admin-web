import { ErrorHttp } from "./errors";

type Cubeta = { cuenta: number; reinicia: number };
const cubetas = new Map<string, Cubeta>();

/**
 * Contador en memoria por instancia (suficiente para el curso; en producción real
 * use el Firewall de Vercel o un almacén compartido). Lanza 429 al superar el límite.
 */
export function limitar(clave: string, max: number, ventanaMs: number, ahora = Date.now()) {
  if (cubetas.size > 5000) {
    for (const [k, v] of cubetas) if (v.reinicia <= ahora) cubetas.delete(k);
  }
  const actual = cubetas.get(clave);
  if (!actual || actual.reinicia <= ahora) {
    cubetas.set(clave, { cuenta: 1, reinicia: ahora + ventanaMs });
    return;
  }
  actual.cuenta += 1;
  if (actual.cuenta > max) {
    const espera = Math.ceil((actual.reinicia - ahora) / 1000);
    throw new ErrorHttp(429, "Demasiadas solicitudes", undefined, { "Retry-After": String(espera) });
  }
}

export function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
}

export function reiniciarLimites() {
  cubetas.clear();
}
