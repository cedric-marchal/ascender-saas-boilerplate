import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

function createRedisClient() {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL || "https://placeholder.upstash.io",
    token: env.UPSTASH_REDIS_REST_TOKEN || "placeholder",
  });
}

const redis = createRedisClient();

const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "@upstash/ratelimit/contact",
  analytics: true,
});

const authenticatedRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "@upstash/ratelimit/authenticated",
  analytics: true,
});

export { authenticatedRatelimit, contactRatelimit };
