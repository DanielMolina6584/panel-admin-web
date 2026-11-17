import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Reglas de calidad que también aplican al código que escriba la IA.
    rules: {
      "no-console": ["error", { allow: ["info", "error"] }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["firebase/firestore", "firebase/firestore/*"], message: "El navegador no habla con Firestore: use la API." },
            { regex: "^firebase-admin(/.*)?$", message: "Solo src/lib/firebase-admin.ts puede importar el Admin SDK." },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: "Prohibido sin sanear." },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      complexity: ["warn", 12],
      eqeqeq: "error",
    },
  },
  {
    files: ["src/lib/firebase-admin.ts", "src/repositories/**", "tests/**", "scripts/**"],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
