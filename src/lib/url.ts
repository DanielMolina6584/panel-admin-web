export type Parametros = Record<string, string | undefined>;

/** Construye `base?a=1&b=2` omitiendo vacíos. */
export function construirUrl(base: string, parametros: Parametros): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(parametros)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

export function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Solo rutas internas: evita redirecciones abiertas con `?next=`. */
export function destinoSeguro(valor: string | undefined): string {
  return valor && /^\/(?!\/)/.test(valor) && !valor.includes("\\") ? valor : "/admin";
}

export function formatearFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";
}
