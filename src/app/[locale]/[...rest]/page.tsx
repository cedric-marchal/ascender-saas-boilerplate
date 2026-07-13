import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

/*
 * Catch-all for unknown paths under a valid locale (`/en/xyz`): triggers the
 * nearest not-found boundary INSIDE `app/[locale]/`, so the 404 renders with
 * the URL's locale instead of falling through to the root not-found.
 */
export default async function CatchAllRoute({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale } = await params;

  if (hasLocale(routing.locales, locale)) {
    setRequestLocale(locale);
  }

  notFound();
}
