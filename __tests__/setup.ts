import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/generated/prisma/client", () => ({
  UserRole: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_NAME: "TestApp",
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
    UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test-token",
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: 10485760,
  },
}));
