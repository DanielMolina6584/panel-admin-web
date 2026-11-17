import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/** Configuración web pública. El navegador solo usa Firebase Auth, nunca Firestore. */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const authCliente = () => getAuth(getApps().length ? getApp() : initializeApp(config));
