import Link from "next/link";

export const metadata = { title: "No encontrado" };

export default function NoEncontrado() {
  return (
    <section>
      <h1>Página no encontrada</h1>
      <p>La dirección no existe o fue movida.</p>
      <Link href="/admin" className="boton">
        Ir al resumen
      </Link>
    </section>
  );
}
