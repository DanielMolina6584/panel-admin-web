# Reglas del proyecto para la IA

Panel de administración con roles y auditoría. Next.js 16 (App Router) + TypeScript + Firebase (Auth + Firestore vía Admin SDK) + Zod + Vitest. Despliegue en Vercel.

## Comandos
- `npm run dev` · `npm run build`
- `npm run verificar` = `eslint` + `tsc --noEmit` + `vitest run` (debe pasar antes de cada commit)

## Estructura (no la rompa)
- `src/app/api/**/route.ts`: solo HTTP + validación Zod; envuelva siempre con `manejar()`.
- `src/services`: reglas de negocio puras. `src/repositories`: ÚNICO lugar que toca Firestore/Admin SDK.
- `src/schemas`: esquemas Zod compartidos (`z.strictObject`). `src/lib`: auth, http, errores, firebase.
- Componentes de servidor por defecto; `"use client"` solo con estado, efectos o eventos.

## Sí
- Verificar sesión y rol en cada Route Handler, Server Component y Server Action (el proxy NO es seguridad).
- El `uid` del actor sale siempre de la sesión verificada, nunca del cuerpo.
- Cada acción administrativa escribe su auditoría en la misma transacción.
- HTML semántico, foco visible, contraste AA, textos en español.

## No
- No leer ni imprimir `.env*`, claves privadas ni credenciales. No pegar secretos en código, logs ni commits.
- No salir de esta carpeta del proyecto. No ejecutar `git push`, `vercel`, `firebase deploy` ni `npm publish` sin permiso explícito.
- No importar `firebase/firestore` en código de navegador. No `dangerouslySetInnerHTML`. No `any`.
- No variables `NEXT_PUBLIC_*` para secretos (solo la config web de Firebase).

## Bitácora
Cada uso relevante de IA se anota en `BITACORA-IA.md` (propósito, evidencia, validación, decisión).
