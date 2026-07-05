import type { Metadata } from "next";

import { getLocaleFromCookies } from "@/i18n/get-locale-from-cookies";
import { getTranslator } from "@/i18n/get-translator";

import { ForbiddenPage } from "@/components/pages/forbidden-page";

/*
 * Root forbidden boundary renders OUTSIDE `app/[locale]/` (no
 * NextIntlClientProvider, no request-config locale), so everything resolves
 * through the context-free helpers with the locale derived from the
 * NEXT_LOCALE cookie.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const translator = getTranslator(locale);

  return {
    title: translator("common.errorPages.forbidden.title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ForbiddenRoute() {
  const locale = await getLocaleFromCookies();

  return <ForbiddenPage locale={locale} />;
}
