import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { usuarioActual } from "@/lib/sesion-servidor";
import { destinoSeguro, primero } from "@/lib/url";

export const metadata = { title: "Iniciar sesión" };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const destino = destinoSeguro(primero((await searchParams).next));
  if (await usuarioActual()) redirect(destino);
  return (
    <section className="login">
      <h1>Iniciar sesión</h1>
      <p>Acceda con su cuenta de administración.</p>
      <LoginForm destino={destino} />
    </section>
  );
}
