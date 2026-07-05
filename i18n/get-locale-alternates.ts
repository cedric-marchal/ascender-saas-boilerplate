import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "next-intl";

type LocaleAlternates = {
  canonical: string;
  languages: Record<string, string>;
};

/**
 * Builds `alternates.canonical` + `alternates.languages` (hreflang) for
 * `generateMetadata()` by iterating `routing.locales` and resolving each
 * locale's path via `getPathname` — NEVER hand-built or enumerated per
 * locale, so adding a locale to `routing.locales` is enough for every page.
 */
function getLocaleAlternates(
  href: Parameters<typeof getPathname>[0]["href"],
  currentLocale: Locale,
): LocaleAlternates {
  const languages: Record<string, string> = {};

  routing.locales.forEach((locale: (typeof routing.locales)[number]) => {
    languages[LOCALE_METADATA[locale].hreflang] = getPathname({
      href,
      locale,
    });
  });

  return {
    canonical: getPathname({ href, locale: currentLocale }),
    languages,
  };
}

export { getLocaleAlternates };
export type { LocaleAlternates };
