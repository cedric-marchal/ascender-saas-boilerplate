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
    "src/lib/generated/**",
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
  // lib/ is infrastructure — it must NEVER import from features/.
  // This prevents dependency inversion (features depend on lib, never the inverse).
  // Exception: lib/auth.ts imports email templates (Better Auth callback constraint).
  {
    files: ["src/lib/**"],
    ignores: ["src/lib/auth.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./.*", "../.*"],
              message: "Utilisez des imports absolus (@/)",
            },
            {
              group: ["@/features/*"],
              message:
                "lib/ ne doit jamais importer depuis features/ (inversion de dépendance)",
            },
          ],
        },
      ],
    },
  },
  // TanStack Table: useReactTable() returns functions that cannot be safely
  // memoized by React Compiler. This is a known incompatibility — the warning
  // is a false positive since React Compiler is not enabled in this project.
  {
    files: ["src/components/ui/data-table.tsx"],
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
  // lib/logger.ts is the single designated console transport (see
  // docs/OBSERVABILITY.md) — every other file must go through `logger.*`.
  {
    files: ["src/lib/logger.ts"],
    rules: {
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
  // Logger/analytics contract tests spy on console.log directly to assert
  // the dev-mode console transport.
  {
    files: ["__tests__/lib/logger.test.ts", "__tests__/lib/analytics.test.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
