import type { Metadata } from "next";

import { PricingPage } from "@/features/pricing/pages/pricing-page";
import { getPricingUserStatus } from "@/features/pricing/services/get-pricing-user-status.service";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

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
    canonical: "/tarifs",
  },
  openGraph: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/tarifs",
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

export default async function PricingRoute() {
  const session = await getSession();

  const { isAuthenticated, isEmailVerified, isCustomer } =
    await getPricingUserStatus(session?.user.id ?? null);

  return (
    <PricingPage
      isAuthenticated={isAuthenticated}
      isEmailVerified={isEmailVerified}
      isCustomer={isCustomer}
    />
  );
}
