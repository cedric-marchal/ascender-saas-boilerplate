import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import { SitemapPage } from "@/components/pages/sitemap-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Plan du site de ${APP_NAME}. Accédez rapidement à toutes les pages disponibles.`;

export const metadata: Metadata = {
  title: "Plan du site",
  description: DESCRIPTION,
  alternates: { canonical: "/plan-du-site" },
  openGraph: {
    title: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/plan-du-site",
  },
  twitter: {
    title: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function PlanDuSiteRoute() {
  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/plan-du-site/#webpage`,
    name: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/plan-du-site`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <SitemapPage />
    </>
  );
}
