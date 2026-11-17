import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function requerir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

/** En Vercel la clave se guarda con `\n` literales: se convierten a saltos de línea al iniciar. */
function clavePrivada(): string {
  return requerir("FIREBASE_PRIVATE_KEY").replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

function app(): App {
  const existente = getApps()[0];
  if (existente) return existente;
  return initializeApp({
    credential: cert({
      projectId: requerir("FIREBASE_PROJECT_ID"),
      clientEmail: requerir("FIREBASE_CLIENT_EMAIL"),
      privateKey: clavePrivada(),
    }),
  });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
