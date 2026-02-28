import type { Metadata } from "next";

import { SitemapPage } from "@/components/pages/sitemap-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Plan du site de ${APP_NAME}. Accédez rapidement à toutes les pages disponibles.`;

export const metadata: Metadata = {
  title: "Plan du site",
  description: DESCRIPTION,
  alternates: {
    canonical: "/plan-du-site",
  },
  openGraph: {
    title: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/plan-du-site",
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

export default function SitemapRoute() {
  return <SitemapPage />;
}
