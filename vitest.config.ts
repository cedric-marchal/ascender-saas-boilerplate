import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.ts",
        "src/utils/**/*.ts",
        "src/features/**/services/**/*.ts",
        "src/features/**/schemas/**/*.ts",
        "src/features/**/actions/**/*.ts",
        "src/features/**/constants/**/*.ts",
      ],
      exclude: [
        "src/lib/generated/**",
        "src/lib/env.ts",
        "src/lib/prisma.ts",
        "src/lib/stripe.ts",
        "src/lib/redis.ts",
        "src/lib/auth.ts",
        "src/lib/auth-client.ts",
        "src/lib/resend.ts",
        "src/lib/ratelimit.ts",
        "src/lib/safe-action.ts",
        "node_modules/**",
      ],
    },
  },
});
