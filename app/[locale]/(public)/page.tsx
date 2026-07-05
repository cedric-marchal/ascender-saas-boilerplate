import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { HomePage } from "@/features/home/pages/home-page";

import { env } from "@/lib/env";

type HomeRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomeRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seoDescription", { appName });
  const alternates = getLocaleAlternates("/", locale as Locale);

  return {
    title: t("title"),
    description,
    keywords: [env.NEXT_PUBLIC_APP_NAME.toLowerCase()],
    alternates,
    openGraph: {
      title: t("title"),
      description,
      url: alternates.canonical,
    },
    twitter: {
      title: t("title"),
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function HomeRoute({ params }: HomeRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <HomePage />;
}
