import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Cabecera } from "@/components/Cabecera";
import { SesionProvider } from "@/components/SesionProvider";
import { usuarioActual } from "@/lib/sesion-servidor";
import "./globals.css";

const fuente = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Panel de administración", template: "%s · Panel de administración" },
  description: "Gestión de usuarios, roles y permisos con registro de auditoría.",
  robots: { index: false, follow: false },
  openGraph: { title: "Panel de administración", description: "Usuarios, roles y auditoría.", locale: "es_CO", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light dark" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  return (
    <html lang="es" className={fuente.className}>
      <body>
        <SesionProvider usuario={usuario}>
          <a href="#contenido" className="saltar">
            Saltar al contenido
          </a>
          <Cabecera />
          <main id="contenido" tabIndex={-1} className="principal">
            {children}
          </main>
          <footer className="pie">
            <p>Panel de administración con roles y auditoría · Next.js y Firebase</p>
          </footer>
        </SesionProvider>
      </body>
    </html>
  );
}
