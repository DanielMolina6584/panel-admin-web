// Uso: npm run crear-admin -- correo@ejemplo.co
// Convierte en administrador a un usuario que YA existe en Firebase Authentication
// (créelo antes en la consola: Authentication → Users → Add user). Solo para el primer admin.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const correo = process.argv[2];
if (!correo) {
  console.error("Falta el correo: npm run crear-admin -- correo@ejemplo.co");
  process.exit(1);
}

const faltan = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].filter((k) => !process.env[k]);
if (faltan.length) {
  console.error(`Faltan variables en .env.local: ${faltan.join(", ")}`);
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "").replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth(app);
const usuario = await auth.getUserByEmail(correo);
await auth.setCustomUserClaims(usuario.uid, { rol: "admin" });
await auth.revokeRefreshTokens(usuario.uid);

const db = getFirestore(app);
const perfil = db.doc(`usuarios/${usuario.uid}/perfil/datos`);
await perfil.set(
  { nombre: usuario.displayName ?? null, correo: usuario.email ?? null, rol: "admin", deshabilitado: false, ultimoAcceso: null },
  { merge: true },
);
await db.collection("auditoria").add({
  actorUid: "script:crear-admin",
  accion: "usuario.rol.cambiar",
  objetivoUid: usuario.uid,
  detalle: { rolAnterior: usuario.customClaims?.rol ?? "usuario", rolNuevo: "admin" },
  creadoEn: new Date().toISOString(),
});
console.info(`Listo: ${correo} (${usuario.uid}) ahora es admin. Debe iniciar sesión de nuevo.`);
