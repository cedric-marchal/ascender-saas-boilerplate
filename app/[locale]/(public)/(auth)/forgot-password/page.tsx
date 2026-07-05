import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";

import { requireGuest } from "@/lib/session";

type ForgotPasswordRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ForgotPasswordRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "auth.forgotPassword",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/forgot-password", locale as Locale);

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
      index: false,
      follow: true,
    },
  };
}

export default async function ForgotPasswordRoute({
  params,
}: ForgotPasswordRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireGuest();

  return <ForgotPasswordPage />;
}
