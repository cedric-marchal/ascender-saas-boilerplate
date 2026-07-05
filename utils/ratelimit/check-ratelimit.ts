import "server-only";

import type { Ratelimit } from "@upstash/ratelimit";

import { TooManyRequestsError } from "@/utils/errors/errors";

async function checkRatelimit(
  ratelimiter: Ratelimit,
  identifier: string,
): Promise<void> {
  const { success } = await ratelimiter.limit(identifier);

  if (!success) {
    throw new TooManyRequestsError("errors.common.tooManyRequests");
  }
}

export { checkRatelimit };
