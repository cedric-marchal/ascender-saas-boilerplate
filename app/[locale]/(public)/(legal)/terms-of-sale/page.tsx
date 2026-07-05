import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { TermsOfSalePage } from "@/features/legal/pages/terms-of-sale-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Conditions de vente de ${APP_NAME}. Découvrez les termes régissant les achats et abonnements sur notre plateforme.`;

export const metadata: Metadata = {
  title: "Conditions de vente",
  description: DESCRIPTION,
  alternates: {
    canonical: "/terms-of-sale",
  },
  openGraph: {
    title: `Conditions de vente | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/terms-of-sale",
  },
  twitter: {
    title: `Conditions de vente | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type TermsOfSaleRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function TermsOfSaleRoute({
  params,
}: TermsOfSaleRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <TermsOfSalePage />;
}
