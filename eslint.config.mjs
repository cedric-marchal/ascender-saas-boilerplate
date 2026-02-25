import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./.*", "../.*"],
              message: "Utilisez des imports absolus (@/)",
            },
          ],
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // TanStack Form uses children as a render prop by design.
      "react/no-children-prop": "off",
      // French text in JSX contains apostrophes — &apos; would be too verbose.
      "react/no-unescaped-entities": "off",
    },
  },
  // Tests: allow `any` for mocks and stubs.
  {
    files: ["__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
