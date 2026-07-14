import { Suspense } from "react";

import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PricingCta } from "@/features/pricing/components/pricing-cta";
import { PricingGridSkeleton } from "@/features/pricing/components/pricing-grid-skeleton";
import { PricingPage } from "@/features/pricing/pages/pricing-page";

type PricingRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PricingRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pricing",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seo.description", { appName });
  const alternates = getLocaleAlternates("/pricing", locale as Locale);

  return {
    title: t("heading"),
    description,
    keywords: [...t.raw("seo.keywords"), appName.toLowerCase()],
    alternates,
    openGraph: {
      title: `${t("heading")} | ${appName}`,
      description,
      url: alternates.canonical,
    },
    twitter: {
      title: `${t("heading")} | ${appName}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PricingRoute({ params }: PricingRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return (
    <PricingPage>
      <Suspense fallback={<PricingGridSkeleton />}>
        <PricingCta />
      </Suspense>
    </PricingPage>
  );
}
