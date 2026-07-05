import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PrivacyPolicyPage } from "@/features/legal/pages/privacy-policy-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Politique de confidentialité de ${APP_NAME}. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.`;

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: DESCRIPTION,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: `Politique de confidentialité | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/privacy-policy",
  },
  twitter: {
    title: `Politique de confidentialité | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type PrivacyPolicyRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPolicyRoute({
  params,
}: PrivacyPolicyRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <PrivacyPolicyPage />;
}
