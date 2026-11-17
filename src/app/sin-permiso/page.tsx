import Link from "next/link";

export const metadata = { title: "Acceso denegado" };

export default function SinPermiso() {
  return (
    <section>
      <h1>Acceso denegado</h1>
      <p>Su cuenta no tiene permiso para ver esta página. Si cree que es un error, pida a un administrador que revise su rol.</p>
      <Link href="/admin" className="boton">
        Volver al inicio
      </Link>
    </section>
  );
}
