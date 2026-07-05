import "server-only";

import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";

import type { AppError } from "@/utils/errors/errors";

const TRANSLATION_KEY_PREFIX = "errors.";

/**
 * Resolves an `AppError`'s user-facing message in the given locale.
 *
 * By convention, `AppError.message` is either a translation key from the
 * `errors.*` namespace (thrown across features/services, e.g.
 * `"errors.organizations.notMember"`) or an already-resolved literal string
 * (e.g. re-thrown from Better Auth's own `APIError`, itself localized by the
 * `@better-auth/i18n` plugin in `lib/auth.ts`) — only keys are translated,
 * literals pass through unchanged.
 */
function translateAppError(error: AppError, locale: Locale): string {
  if (!error.message.startsWith(TRANSLATION_KEY_PREFIX)) {
    return error.message;
  }

  const translator = getTranslator(locale);

  return translator(
    error.message as Parameters<typeof translator>[0],
    error.params as never,
  );
}

export { translateAppError };
