"use client";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section>
      <h1>Algo salió mal</h1>
      <p role="alert">No pudimos cargar esta pantalla. Puede ser un problema temporal.</p>
      <button type="button" className="boton" onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
