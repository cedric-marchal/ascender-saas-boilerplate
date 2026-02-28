import type { Metadata } from "next";

import { TermsOfSalePage } from "@/features/legal/pages/terms-of-sale-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Conditions de vente de ${APP_NAME}. Découvrez les termes régissant les achats et abonnements sur notre plateforme.`;

export const metadata: Metadata = {
  title: "Conditions de vente",
  description: DESCRIPTION,
  alternates: { canonical: "/conditions-de-vente" },
  openGraph: {
    title: `Conditions de vente | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/conditions-de-vente",
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

export default function ConditionsDeVenteRoute() {
  return <TermsOfSalePage />;
}