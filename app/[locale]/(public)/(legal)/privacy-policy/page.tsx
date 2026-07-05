import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrivacyPolicyPage } from "@/features/legal/pages/privacy-policy-page";

type PrivacyPolicyRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PrivacyPolicyRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "legal.privacyPolicy",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/privacy-policy", locale as Locale);

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

export default async function PrivacyPolicyRoute({
  params,
}: PrivacyPolicyRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <PrivacyPolicyPage />;
}
