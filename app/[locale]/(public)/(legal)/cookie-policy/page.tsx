import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CookiePolicyPage } from "@/features/legal/pages/cookie-policy-page";

type CookiePolicyRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CookiePolicyRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "legal.cookiePolicy",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/cookie-policy", locale as Locale);

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

export default async function CookiePolicyRoute({
  params,
}: CookiePolicyRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <CookiePolicyPage />;
}
