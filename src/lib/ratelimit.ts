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

// Mirrors lib/auth.ts customRules for "/sign-in/email" (window: 10, max: 5).
// Keyed IP+email so a single attacker cannot lock out other users sharing an IP.
const authSignInRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "@upstash/ratelimit/auth-sign-in",
  analytics: true,
});

// Mirrors lib/auth.ts customRules for "/sign-up/email" (window: 10, max: 3).
const authSignUpRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 s"),
  prefix: "@upstash/ratelimit/auth-sign-up",
  analytics: true,
});

// Mirrors lib/auth.ts customRules for "/reset-password" and "/forget-password" (window: 60, max: 3).
const authPasswordRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  prefix: "@upstash/ratelimit/auth-password",
  analytics: true,
});

// Authenticated limiter for organization invitations (email-bomb vector).
const invitationRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: "@upstash/ratelimit/invitation",
  analytics: true,
});

// Authenticated limiter for organization creation (each creation provisions a
// Stripe customer via the afterCreateOrganization hook — cap the abuse vector).
const organizationRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "@upstash/ratelimit/organization",
  analytics: true,
});

export {
  authenticatedRatelimit,
  authPasswordRatelimit,
  authSignInRatelimit,
  authSignUpRatelimit,
  contactRatelimit,
  filterRatelimit,
  invitationRatelimit,
  organizationRatelimit,
};
