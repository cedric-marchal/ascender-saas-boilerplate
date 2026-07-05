import { Suspense } from "react";

import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PricingCta } from "@/features/pricing/components/pricing-cta";
import { PricingGridSkeleton } from "@/features/pricing/components/pricing-grid-skeleton";
import { PricingPage } from "@/features/pricing/pages/pricing-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Découvrez les tarifs de ${APP_NAME} : offres flexibles pour les indépendants, équipes et entreprises, sans engagement.`;

export const metadata: Metadata = {
  title: "Tarifs",
  description: DESCRIPTION,
  keywords: [
    "tarifs",
    "prix",
    "abonnements",
    APP_NAME.toLowerCase(),
    "saas pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/pricing",
  },
  twitter: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type PricingRouteProps = {
  params: Promise<{ locale: string }>;
};

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
