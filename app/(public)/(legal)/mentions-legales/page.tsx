import type { Metadata } from "next";

import { LegalNoticePage } from "@/features/legal/pages/legal-notice-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Mentions légales de ${APP_NAME}. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site.`;

export const metadata: Metadata = {
  title: "Mentions légales",
  description: DESCRIPTION,
  alternates: {
    canonical: "/mentions-legales",
  },
  openGraph: {
    title: `Mentions légales | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/mentions-legales",
  },
  twitter: {
    title: `Mentions légales | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalNoticeRoute() {
  return <LegalNoticePage />;
}
