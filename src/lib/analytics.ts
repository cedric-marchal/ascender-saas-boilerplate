import "server-only";

import { logger } from "@/lib/logger";

/**
 * Core funnel events tracked across the app. Add new events here first —
 * `trackEvent` only accepts events declared in this union, so a typo can't
 * silently create an untracked event name.
 */
type AnalyticsEvent =
  | "user_signed_up"
  | "organization_created"
  | "checkout_started"
  | "subscription_activated"
  | "invitation_sent"
  | "project_created";

type AnalyticsProperties = Record<string, unknown>;

/**
 * Typed, server-side event tracker. Today: a no-op in production, a
 * `logger.debug` call in development so the call sites are visible while
 * building the funnel.
 *
 * Future-PostHog seam: once `posthog-node` is installed (see
 * `docs/OBSERVABILITY.md`), gate this behind the user's cookie-consent
 * analytics category and replace the body with:
 *
 * ```ts
 * posthogClient.capture({
 *   distinctId: properties?.userId as string ?? "anonymous",
 *   event,
 *   properties,
 * });
 * ```
 *
 * Every call site stays unchanged — only this function's body changes.
 */
function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  logger.debug(`Analytics event: ${event}`, properties);
}

export { trackEvent };
export type { AnalyticsEvent, AnalyticsProperties };
