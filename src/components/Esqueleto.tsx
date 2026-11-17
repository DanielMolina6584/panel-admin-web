export function Esqueleto({ filas = 5 }: { filas?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando">
      <span className="solo-lectores">Cargando…</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="esqueleto" aria-hidden="true" />
      ))}
    </div>
  );
}
