import type { Metadata } from "next";

import { TermsOfServicePage } from "@/features/legal/pages/terms-of-service-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Conditions d'utilisation de ${APP_NAME}. Lisez les règles et obligations régissant l'utilisation de notre service.`;

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: DESCRIPTION,
  alternates: {
    canonical: "/conditions-d-utilisation",
  },
  openGraph: {
    title: `Conditions d'utilisation | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/conditions-d-utilisation",
  },
  twitter: {
    title: `Conditions d'utilisation | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServiceRoute() {
  return <TermsOfServicePage />;
}
