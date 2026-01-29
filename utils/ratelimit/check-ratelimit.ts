import "server-only";

import type { Ratelimit } from "@upstash/ratelimit";

import { env } from "@/lib/env";

import { TooManyRequestsError } from "@/utils/api/handle-api-error";

async function checkRatelimit(
  ratelimiter: Ratelimit,
  identifier: string
): Promise<void> {
  if (
    !env.UPSTASH_REDIS_REST_URL ||
    !env.UPSTASH_REDIS_REST_TOKEN ||
    env.UPSTASH_REDIS_REST_URL === "your-url-here" ||
    env.UPSTASH_REDIS_REST_TOKEN === "your-token-here"
  ) {
    console.warn(
      "[Rate Limit] Upstash credentials not configured. Skipping rate limit check."
    );
    return;
  }

  const { success } = await ratelimiter.limit(identifier);

  if (!success) {
    throw new TooManyRequestsError(
      "Trop de requêtes. Veuillez réessayer plus tard."
    );
  }
}

export { checkRatelimit };
