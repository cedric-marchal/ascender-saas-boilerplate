import "@testing-library/jest-dom";

import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/generated/prisma/client", () => ({
  Prisma: {
    TransactionIsolationLevel: {
      ReadUncommitted: "ReadUncommitted",
      ReadCommitted: "ReadCommitted",
      RepeatableRead: "RepeatableRead",
      Serializable: "Serializable",
    },
  },
  UserRole: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
  SubscriptionStatus: {
    INCOMPLETE: "INCOMPLETE",
    INCOMPLETE_EXPIRED: "INCOMPLETE_EXPIRED",
    TRIALING: "TRIALING",
    ACTIVE: "ACTIVE",
    PAST_DUE: "PAST_DUE",
    CANCELED: "CANCELED",
    UNPAID: "UNPAID",
    PAUSED: "PAUSED",
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_NAME: "TestApp",
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
    NEXT_PUBLIC_R2_PUBLIC_URL: "https://r2.test.example.com",
    R2_ACCOUNT_ID: "test-account-id",
    R2_ACCESS_KEY_ID: "test-access-key",
    R2_SECRET_ACCESS_KEY: "test-secret-key",
    R2_BUCKET_NAME: "test-bucket",
    UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test-token",
    NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE: 10485760,
  },
}));
