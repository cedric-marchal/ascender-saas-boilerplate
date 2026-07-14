# Observability

Groundwork for production error tracking (Sentry) and product analytics
(PostHog), implemented **without adding any dependency**. Everything below
already works today; the two vendor SDKs plug into the seams described here
without touching any other call site.

Full plan: `aidd_docs/tasks/2026_07/2026_07_05-audit-boilerplate-yc-part-3.md`.

## What exists now

| Piece                    | File                                                                                                                                            | Status                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Structured logger        | `src/lib/logger.ts`                                                                                                                             | Active — the single logging surface, console transport only      |
| Exception capture seam   | `src/lib/observability.ts` (`captureException`)                                                                                                 | Active — logs via `logger.error`, no vendor call yet             |
| Capture wiring           | `src/lib/safe-action.ts`, `src/utils/errors/handle-api-error.ts`                                                                                | Active — calls `captureException` for unexpected errors only     |
| Analytics no-op tracker  | `src/lib/analytics.ts` (`trackEvent`)                                                                                                           | Active — `logger.debug` in dev, no-op in prod, typed event union |
| Analytics exemplar sites | `src/features/auth/actions/sign-up.action.ts` (`user_signed_up`), `src/features/billing/actions/create-checkout.action.ts` (`checkout_started`) | Active — pattern demonstrated, not exhaustively instrumented     |
| Env slots (inert)        | `src/lib/env.ts`, `.env.example`                                                                                                                | Optional vars, absent = disabled, app boots either way           |

`console.error`/`console.warn` have been removed from `src/features/`, `src/lib/`,
and `src/utils/` — every call site now goes through `logger.*`.

## Remaining steps to activate Sentry

1. `pnpm add @sentry/nextjs`
2. Create `instrumentation.ts` (server + edge init) and
   `instrumentation-client.ts` (client init) per the Next.js 16 instrumentation
   hook pattern — read the installed `@sentry/nextjs` version's docs first,
   do not code from memory.
3. Wrap `next.config.ts` with `withSentryConfig` (source maps upload).
4. Fill in the `Sentry.captureException(...)` call documented in the JSDoc of
   `src/lib/observability.ts` — no other file changes, every call site
   (`src/lib/safe-action.ts`, `src/utils/errors/handle-api-error.ts`) already calls
   `captureException`.
5. Report to Sentry from `src/app/global-error.tsx` and `src/app/error.tsx` as well
   (render-time errors bypass `handleServerError`/`handleApiError`).
6. Set `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client) — both
   already declared as optional vars in `src/lib/env.ts`.
7. Extend the CSP in `src/proxy.ts` to allow the Sentry ingest domains:
   - `connect-src`: `https://*.ingest.sentry.io`, `https://*.ingest.us.sentry.io`
     (or your region's ingest host, per the DSN issued by Sentry)
8. Verify: throw a test error in dev with a DSN configured, confirm it
   appears in the Sentry dashboard with a source-mapped stack trace.

## Remaining steps to activate PostHog

1. `pnpm add posthog-js posthog-node`
2. Fill in the `posthogClient.capture(...)` call documented in the JSDoc of
   `src/lib/analytics.ts` — no other file changes, `trackEvent` is already called
   at the two exemplar sites and can be added to the rest of the funnel
   (`organization_created`, `subscription_activated`, `invitation_sent`,
   `project_created`) the same way.
3. Add a `PostHogProvider` in `src/app/providers.tsx`, initialized client-side
   **only after** the user has accepted the `analytics` cookie-consent
   category (see `src/features/cookie-consent/`) — opt the user out again if
   consent is revoked. No PostHog network call may fire before consent.
4. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` — both
   already declared as optional vars in `src/lib/env.ts`.
5. Extend the CSP in `src/proxy.ts` to allow the PostHog domains:
   - `connect-src`: `https://*.posthog.com` (or your self-hosted PostHog host)
   - `script-src`: `https://*.posthog.com` if using the `posthog-js` snippet
     loader instead of the npm package
6. Verify: accept analytics cookies, trigger `user_signed_up`, confirm the
   event lands in PostHog; revoke consent, confirm no further events fire.

## Design notes

- `src/lib/logger.ts` and `src/lib/observability.ts` are intentionally tiny — they
  are seams, not frameworks. Do not add batching, sampling, or transport
  abstractions until an actual vendor is wired in.
- `captureException` is called for **unexpected** errors only. Expected
  business errors (`AppError` subclasses, `ZodError` validation failures)
  are normal control flow, not incidents, and must never reach Sentry —
  wiring this differently would flood the Sentry project with noise.
- `trackEvent` no-ops in production until PostHog is installed, so shipping
  this groundwork has zero user-facing effect.
