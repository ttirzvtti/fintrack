import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fetching data on mount and setting state is a standard pattern.
      // The recommended fix is using a data-fetching library (SWR/React Query),
      // but for this project the pattern is intentional and works correctly.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Ignore lint errors in auto-generated shadcn/ui components
  {
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
