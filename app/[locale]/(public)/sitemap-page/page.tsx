import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { env } from "@/lib/env";

import { SitemapPage } from "@/components/pages/sitemap-page";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Plan du site de ${APP_NAME}. Accédez rapidement à toutes les pages disponibles.`;

export const metadata: Metadata = {
  title: "Plan du site",
  description: DESCRIPTION,
  alternates: {
    canonical: "/sitemap-page",
  },
  openGraph: {
    title: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/sitemap-page",
  },
  twitter: {
    title: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type SitemapRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function SitemapRoute({ params }: SitemapRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <SitemapPage />;
}
