import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LegalNoticePage } from "@/features/legal/pages/legal-notice-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Mentions légales de ${APP_NAME}. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site.`;

export const metadata: Metadata = {
  title: "Mentions légales",
  description: DESCRIPTION,
  alternates: {
    canonical: "/legal-notice",
  },
  openGraph: {
    title: `Mentions légales | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/legal-notice",
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

type LegalNoticeRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function LegalNoticeRoute({
  params,
}: LegalNoticeRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <LegalNoticePage />;
}
