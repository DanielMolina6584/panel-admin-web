import Link from "next/link";
import { construirUrl, type Parametros } from "@/lib/url";

export function Paginacion({ base, parametros, siguienteCursor }: { base: string; parametros: Parametros; siguienteCursor: string | null }) {
  return (
    <nav aria-label="Paginación" className="paginacion">
      {parametros.cursor ? <Link href={construirUrl(base, { ...parametros, cursor: undefined })}>Primera página</Link> : <span />}
      {siguienteCursor ? (
        <Link href={construirUrl(base, { ...parametros, cursor: siguienteCursor })} rel="next">
          Siguiente página
        </Link>
      ) : (
        <span className="ayuda">No hay más resultados</span>
      )}
    </nav>
  );
}
