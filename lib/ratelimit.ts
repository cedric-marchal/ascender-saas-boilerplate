import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

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

const filterRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "@upstash/ratelimit/filter",
  analytics: true,
});

export { authenticatedRatelimit, contactRatelimit, filterRatelimit };
