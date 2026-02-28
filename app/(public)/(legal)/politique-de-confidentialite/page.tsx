import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/features/legal/pages/privacy-policy-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Politique de confidentialité de ${APP_NAME}. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.`;

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: DESCRIPTION,
  alternates: { canonical: "/politique-de-confidentialite" },
  openGraph: {
    title: `Politique de confidentialité | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/politique-de-confidentialite",
  },
  twitter: {
    title: `Politique de confidentialité | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function PolitiqueDeConfidentialiteRoute() {
  return <PrivacyPolicyPage />;
}
