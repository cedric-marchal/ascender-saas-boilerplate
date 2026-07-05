import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

/**
 * Single logging surface for the whole app. Console transport only:
 * pretty-printed in development, single-line JSON in production so log
 * aggregators (Vercel logs, Datadog, etc.) can parse each line as one event.
 *
 * Future-Sentry seam: once `@sentry/nextjs` is installed (see
 * `docs/OBSERVABILITY.md`), `logger.warn`/`logger.error` should also push a
 * Sentry breadcrumb (`Sentry.addBreadcrumb({ level, message, data: context })`)
 * right before the console write below — this keeps every log call site
 * unchanged while breadcrumbs start flowing automatically.
 */
function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();

  const consoleMethod =
    level === "warn" ? "warn" : level === "error" ? "error" : "log";

  if (process.env.NODE_ENV === "production") {
    const entry = {
      timestamp,
      level,
      message,
      ...context,
    };

    console[consoleMethod](JSON.stringify(entry));

    return;
  }

  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (context) {
    console[consoleMethod](prefix, message, context);

    return;
  }

  console[consoleMethod](prefix, message);
}

const logger = {
  debug(message: string, context?: LogContext): void {
    writeLog("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    writeLog("error", message, context);
  },
};

export { logger };
export type { LogContext, LogLevel };
