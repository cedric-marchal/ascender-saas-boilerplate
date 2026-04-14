import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated files — never lint these.
    "lib/generated/**",
    // Coverage reports.
    "coverage/**",
  ]),
  ...nextVitals,
  ...nextTs,
  prettier,
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
  // TanStack Table: useReactTable() returns functions that cannot be safely
  // memoized by React Compiler. This is a known incompatibility — the warning
  // is a false positive since React Compiler is not enabled in this project.
  {
    files: ["components/ui/data-table.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  // Seed files: run outside Next.js, so @/ imports don't resolve with tsx.
  {
    files: ["prisma/seed.ts", "prisma/seed/**"],
    rules: {
      "no-restricted-imports": "off",
      "no-console": "off",
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
