import { describe, expect, it, vi } from "vitest";

import { TooManyRequestsError } from "@/utils/errors/errors";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

describe("checkRatelimit", () => {
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

  it("throws with the errors.common.tooManyRequests translation key", async () => {
    const mockRatelimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };

    await expect(
      checkRatelimit(mockRatelimiter as any, "test-id"),
    ).rejects.toThrow("errors.common.tooManyRequests");
  });
});
