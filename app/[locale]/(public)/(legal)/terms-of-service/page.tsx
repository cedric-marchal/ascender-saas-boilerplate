import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { TermsOfServicePage } from "@/features/legal/pages/terms-of-service-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Conditions d'utilisation de ${APP_NAME}. Lisez les règles et obligations régissant l'utilisation de notre service.`;

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: DESCRIPTION,
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title: `Conditions d'utilisation | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/terms-of-service",
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

type TermsOfServiceRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function TermsOfServiceRoute({
  params,
}: TermsOfServiceRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <TermsOfServicePage />;
}
