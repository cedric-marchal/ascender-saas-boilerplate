import "server-only";

import { cookies } from "next/headers";

import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";

const NEXT_LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Derives the active locale from the `NEXT_LOCALE` cookie via `next/headers`.
 * Used for API routes (`app/api/**`), which `proxy.ts` deliberately excludes
 * from next-intl's locale negotiation, so `getLocale()` from `next-intl/server`
 * cannot be relied upon there. Falls back to `defaultLocale` when the cookie
 * is missing or holds an unsupported value.
 */
async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(NEXT_LOCALE_COOKIE_NAME)?.value;

  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export { getLocaleFromCookies };
