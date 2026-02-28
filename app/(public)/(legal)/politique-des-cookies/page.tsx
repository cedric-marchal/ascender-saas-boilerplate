import type { Metadata } from "next";

import { CookiePolicyPage } from "@/features/legal/pages/cookie-policy-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Politique des cookies de ${APP_NAME}. Découvrez les cookies utilisés sur notre site et comment gérer vos préférences.`;

export const metadata: Metadata = {
  title: "Politique des cookies",
  description: DESCRIPTION,
  alternates: {
    canonical: "/politique-des-cookies",
  },
  openGraph: {
    title: `Politique des cookies | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/politique-des-cookies",
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

export default function CookiePolicyRoute() {
  return <CookiePolicyPage />;
}
