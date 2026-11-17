# 43 · Panel de administración con roles y auditoría

Next.js 16 (App Router) + TypeScript + Firebase Auth/Firestore (solo vía Admin SDK) + Zod + Vitest. Interfaz y API REST en un solo proyecto.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local     # complete los valores (ver "Firebase" abajo)
npm run dev                    # http://localhost:3000
npm run verificar              # lint + tipos + pruebas
```

## Firebase (una sola vez)

1. **Proyecto:** <https://console.firebase.google.com> → *Agregar proyecto*.
2. **Authentication:** *Build → Authentication → Comenzar → Sign-in method → Correo electrónico/contraseña → Habilitar*.
3. **Firestore:** *Build → Firestore Database → Crear base de datos* → ubicación cercana → **modo producción**.
4. **Reglas e índices:** con la CLI (`npm i -g firebase-tools`, `firebase login`, `firebase use --add`):
   `firebase deploy --only firestore:rules,firestore:indexes`
   (o pegue `firestore.rules` en *Firestore → Reglas*; los índices de `firestore.indexes.json` también se pueden crear a mano).
5. **Config web (pública):** *Configuración del proyecto ⚙ → General → Tus apps → `</>` Web* → registre la app y copie `apiKey`, `authDomain`, `projectId`, `appId` a `NEXT_PUBLIC_FIREBASE_*` en `.env.local`.
6. **Cuenta de servicio (privada):** *Configuración ⚙ → Cuentas de servicio → Generar nueva clave privada*. Del JSON copie a `.env.local`: `project_id` → `FIREBASE_PROJECT_ID`, `client_email` → `FIREBASE_CLIENT_EMAIL`, `private_key` → `FIREBASE_PRIVATE_KEY` (entre comillas, con los `\n` literales). **No suba ese JSON a Git** y bórrelo después.
7. **Primer administrador:** en *Authentication → Users → Agregar usuario* cree su cuenta (correo + contraseña) y ejecute
   `npm run crear-admin -- su-correo@ejemplo.co`. Luego inicie sesión en `/login`. Los demás usuarios se crean igual en la consola y usted les asigna roles desde el panel.

## Despliegue en Vercel

1. `npm i -g vercel` · `vercel login` · `vercel link`.
2. Cargue las 7 variables (4 `NEXT_PUBLIC_*` y 3 `FIREBASE_*`) en *Project → Settings → Environment Variables*; en `FIREBASE_PRIVATE_KEY` pegue la clave con `\n` literales.
3. `vercel deploy --prod`. Agregue el dominio de Vercel en *Firebase → Authentication → Settings → Authorized domains*.
4. Compruebe `GET /api/auth/yo` (debe dar `401` sin sesión) y el flujo de login en producción.

## Cómo está organizado

| Capa | Dónde | Regla |
|---|---|---|
| Proxy | `src/proxy.ts` | Solo redirige a `/login` si falta la cookie (comodidad, no seguridad) |
| Páginas | `src/app/**` | `requerirPagina(roles)` verifica sesión y rol |
| Acciones | `src/app/admin/usuarios/[uid]/actions.ts` | Server Actions que vuelven a verificar sesión y rol |
| API | `src/app/api/**/route.ts` | `manejar()` + `requerirRolEnPeticion()` + Zod |
| Servicios | `src/services` | Reglas de negocio (último admin, auto-deshabilitado) |
| Repositorios | `src/repositories` | Único acceso a Firestore y al Admin SDK |

Decisiones a tener en cuenta:
- **Roles:** `usuario` (sin acceso al panel), `moderador` (solo lectura de usuarios), `admin` (todo, incluida la auditoría).
- Al cambiar un rol se revocan las sesiones del usuario, así el claim nuevo aplica de inmediato (criterio 2).
- La auditoría se escribe en la **misma transacción de Firestore** que el cambio en el perfil; el claim de Auth se aplica justo después (Auth no participa en transacciones de Firestore).
- La regla del último admin se comprueba dentro de la transacción (consulta de grupo `perfil` por `rol` y `deshabilitado`, por eso los índices).
- El límite de frecuencia es un contador en memoria por instancia; para producción real use el Firewall de Vercel.
- El orden de la tabla de usuarios se aplica dentro de cada página (Firebase Auth lista por uid).

## Pruebas y documentación

- `npm test`: API (tabla de permisos, 400/401/403/404/409), integración ruta → servicio → repositorio, componentes (foco del diálogo, login, tabla) y evidencias de la configuración de IA (`ia/`).
- `openapi.yaml` y colección Bruno en `bruno/` (abra la carpeta en Bruno, entorno `local`, pegue los idToken en el entorno; un idToken se obtiene al iniciar sesión con el SDK web o con la API REST de Firebase Auth).
- Evidencias de calidad: `CALIDAD.md` y `calidad/`. Bitácora de IA: `BITACORA-IA.md`. Reglas de IA: `CLAUDE.md` y `.claude/settings.json`.
