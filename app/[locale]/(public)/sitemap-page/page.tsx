import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { env } from "@/lib/env";

import { SitemapPage } from "@/components/pages/sitemap-page";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type SitemapRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SitemapRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "common.sitemapPage",
  });

  const description = t("seoDescription", { appName: APP_NAME });
  const alternates = getLocaleAlternates("/sitemap-page", locale as Locale);

  return {
    title: t("title"),
    description,
    alternates,
    openGraph: {
      title: `${t("title")} | ${APP_NAME}`,
      description,
      url: alternates.canonical,
    },
    twitter: {
      title: `${t("title")} | ${APP_NAME}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function SitemapRoute({ params }: SitemapRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <SitemapPage />;
}
