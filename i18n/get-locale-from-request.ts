import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";

const NEXT_LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Derives the active locale from the `NEXT_LOCALE` cookie of a raw `Request`
 * object. Used in contexts that receive a `Request` but are not covered by
 * next-intl's own request config — e.g. Better Auth hooks for the catch-all
 * `/api/auth/[...all]` route, which `proxy.ts` deliberately excludes from
 * locale negotiation (see i18n/routing.ts). Falls back to `defaultLocale`
 * when the cookie is missing or holds an unsupported value.
 */
function getLocaleFromRequest(request: Request | undefined): Locale {
  const cookieHeader = request?.headers.get("cookie");
  const match = cookieHeader?.match(
    new RegExp(`${NEXT_LOCALE_COOKIE_NAME}=([^;]+)`),
  );
  const value = match?.[1];

  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export { getLocaleFromRequest };
