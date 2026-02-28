import "server-only";

import type { Ratelimit } from "@upstash/ratelimit";

import { env } from "@/lib/env";

import { TooManyRequestsError } from "@/utils/errors/errors";

const PLACEHOLDER_VALUES = ["your-url-here", "your-token-here"];

function isRatelimitConfigured(): boolean {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return false;
  }

  if (PLACEHOLDER_VALUES.includes(url) || PLACEHOLDER_VALUES.includes(token)) {
    return false;
  }

  return true;
}

async function checkRatelimit(
  ratelimiter: Ratelimit,
  identifier: string,
): Promise<void> {
  if (!isRatelimitConfigured()) {
    return;
  }

  const { success } = await ratelimiter.limit(identifier);

  if (!success) {
    throw new TooManyRequestsError(
      "Trop de requêtes. Veuillez réessayer plus tard.",
    );
  }
}

export { checkRatelimit };
