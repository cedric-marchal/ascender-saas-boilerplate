import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "utils/**/*.ts", "app/**/_lib/**/*.ts"],
      exclude: [
        "lib/generated/**",
        "lib/env.ts",
        "lib/prisma.ts",
        "lib/stripe.ts",
        "lib/redis.ts",
        "lib/auth.ts",
        "lib/auth-client.ts",
        "lib/resend.ts",
        "lib/safe-action.ts",
        "node_modules/**",
      ],
    },
  },
});
