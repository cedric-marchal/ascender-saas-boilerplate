import "server-only";

import { logger } from "@/lib/logger";

type CaptureContext = {
  userId?: string;
  organizationId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

/**
 * The future-Sentry seam. Call this for every UNEXPECTED error (never for
 * business errors like `AppError`/`ZodError`, which are expected control
 * flow, not incidents).
 *
 * Today: logs via `logger.error` so the failure is at least visible in
 * console/log aggregation.
 *
 * Once `@sentry/nextjs` is installed (see `docs/OBSERVABILITY.md`), replace
 * the body with:
 *
 * ```ts
 * Sentry.captureException(error, {
 *   user: context?.userId ? { id: context.userId } : undefined,
 *   tags: { organizationId: context?.organizationId, ...context?.tags },
 *   extra: context?.extra,
 * });
 * ```
 *
 * Every call site (`lib/safe-action.ts`, `utils/errors/handle-api-error.ts`,
 * `app/global-error.tsx`, `app/error.tsx`) stays unchanged — only this
 * function's body changes.
 */
function captureException(error: unknown, context?: CaptureContext): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  const errorName = error instanceof Error ? error.name : typeof error;
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(message, {
    errorName,
    stack,
    ...context,
  });
}

export { captureException };
export type { CaptureContext };
