import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";

const NEXT_LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Reads the active locale from the `NEXT_LOCALE` cookie via `document.cookie`.
 * For client components that may render outside `NextIntlClientProvider`
 * (e.g. `error-page.tsx`, `global-error-page.tsx`), where `useLocale()` and
 * `useTranslations()` are unavailable. Falls back to `defaultLocale` when
 * `document` is unavailable (SSR) or the cookie is missing/unsupported.
 */
function getClientLocale(): Locale {
  if (typeof document === "undefined") {
    return routing.defaultLocale;
  }

  const match = document.cookie.match(
    new RegExp(`${NEXT_LOCALE_COOKIE_NAME}=([^;]+)`),
  );
  const value = match?.[1];

  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export { getClientLocale };
