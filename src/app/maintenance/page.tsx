import type { Metadata } from "next";

import { getLocaleFromCookies } from "@/i18n/get-locale-from-cookies";
import { getTranslator } from "@/i18n/get-translator";

import { MaintenancePage } from "@/components/pages/maintenance-page";

/*
 * Lives OUTSIDE `app/[locale]/` — proxy.ts rewrites every request to
 * `/maintenance` before locale negotiation, so the page previously always
 * rendered the default locale for every visitor. Locale is now derived from
 * the `NEXT_LOCALE` cookie instead.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookies();
  const translator = getTranslator(locale);

  return {
    title: translator("common.errorPages.maintenance.title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function MaintenanceRoute() {
  const locale = await getLocaleFromCookies();

  return <MaintenancePage locale={locale} />;
}
