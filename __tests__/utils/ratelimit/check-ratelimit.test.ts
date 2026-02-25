import { describe, expect, it, vi } from "vitest";

import { TooManyRequestsError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const mockEnv = {
  UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-token",
};

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

describe("checkRatelimit", () => {
  it("skips rate limit when UPSTASH_REDIS_REST_URL is empty", async () => {
    mockEnv.UPSTASH_REDIS_REST_URL = "";

    const mockRatelimiter = { limit: vi.fn() };
    await checkRatelimit(mockRatelimiter as any, "test-id");

    expect(mockRatelimiter.limit).not.toHaveBeenCalled();

    mockEnv.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  });

  it("skips rate limit when UPSTASH_REDIS_REST_TOKEN is empty", async () => {
    mockEnv.UPSTASH_REDIS_REST_TOKEN = "";

    const mockRatelimiter = { limit: vi.fn() };
    await checkRatelimit(mockRatelimiter as any, "test-id");

    expect(mockRatelimiter.limit).not.toHaveBeenCalled();

    mockEnv.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("skips rate limit when URL is placeholder", async () => {
    mockEnv.UPSTASH_REDIS_REST_URL = "your-url-here";

    const mockRatelimiter = { limit: vi.fn() };
    await checkRatelimit(mockRatelimiter as any, "test-id");

    expect(mockRatelimiter.limit).not.toHaveBeenCalled();

    mockEnv.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  });

  it("skips rate limit when token is placeholder", async () => {
    mockEnv.UPSTASH_REDIS_REST_TOKEN = "your-token-here";

    const mockRatelimiter = { limit: vi.fn() };
    await checkRatelimit(mockRatelimiter as any, "test-id");

    expect(mockRatelimiter.limit).not.toHaveBeenCalled();

    mockEnv.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("allows request when rate limit succeeds", async () => {
    const mockRatelimiter = {
      limit: vi.fn().mockResolvedValue({ success: true }),
    };

    await expect(
      checkRatelimit(mockRatelimiter as any, "test-id"),
    ).resolves.toBeUndefined();

    expect(mockRatelimiter.limit).toHaveBeenCalledWith("test-id");
  });

  it("throws TooManyRequestsError when rate limit fails", async () => {
    const mockRatelimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };

    await expect(
      checkRatelimit(mockRatelimiter as any, "test-id"),
    ).rejects.toThrow(TooManyRequestsError);
  });

  it("throws with correct French message when rate limit fails", async () => {
    const mockRatelimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };

    await expect(
      checkRatelimit(mockRatelimiter as any, "test-id"),
    ).rejects.toThrow("Trop de requêtes. Veuillez réessayer plus tard.");
  });
});
