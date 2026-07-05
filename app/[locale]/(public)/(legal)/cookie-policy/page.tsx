import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { CookiePolicyPage } from "@/features/legal/pages/cookie-policy-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Politique des cookies de ${APP_NAME}. Découvrez les cookies utilisés sur notre site et comment gérer vos préférences.`;

export const metadata: Metadata = {
  title: "Politique des cookies",
  description: DESCRIPTION,
  alternates: {
    canonical: "/cookie-policy",
  },
  openGraph: {
    title: `Politique des cookies | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/cookie-policy",
  },
  twitter: {
    title: `Politique des cookies | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type CookiePolicyRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function CookiePolicyRoute({
  params,
}: CookiePolicyRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <CookiePolicyPage />;
}
