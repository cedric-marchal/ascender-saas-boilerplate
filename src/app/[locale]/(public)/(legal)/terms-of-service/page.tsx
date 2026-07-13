import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TermsOfServicePage } from "@/features/legal/pages/terms-of-service-page";

type TermsOfServiceRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TermsOfServiceRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "legal.termsOfService",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/terms-of-service", locale as Locale);

  return {
    title: t("title"),
    description,
    alternates,
    openGraph: {
      title: `${t("title")} | ${appName}`,
      description,
      url: alternates.canonical,
    },
    twitter: {
      title: `${t("title")} | ${appName}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TermsOfServiceRoute({
  params,
}: TermsOfServiceRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <TermsOfServicePage />;
}
