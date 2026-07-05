import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpPage } from "@/features/auth/pages/sign-up-page";

import { requireGuest } from "@/lib/session";

type SignUpRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SignUpRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "auth.signUp",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/sign-up", locale as Locale);

  return {
    title: t("title"),
    description,
    keywords: [appName.toLowerCase(), "sign up"],
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

export default async function SignUpRoute({ params }: SignUpRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireGuest();

  return <SignUpPage />;
}
