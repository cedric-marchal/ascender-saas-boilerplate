import type { Metadata } from "next";
import type { WebSite, Organization, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "[Ta description de 150-160 caractères ici]";

export const metadata: Metadata = {
  title: `${APP_NAME} - [Tagline courte]`, // Page d'accueil = titre complet, pas template
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "mot-clé-1", "mot-clé-2", "mot-clé-3"],
  alternates: {
    canonical: "/", // Relatif suffit grâce à metadataBase du layout
  },
  openGraph: {
    title: `${APP_NAME} - [Tagline courte]`,
    description: DESCRIPTION,
    url: "/",
    // images héritées du layout si identiques, sinon override ici
  },
  twitter: {
    title: `${APP_NAME} - [Tagline courte]`,
    description: DESCRIPTION,
    // images héritées du layout
  },
};

export default function HomePage() {
  const websiteSchema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: APP_NAME,
    url: BASE_URL,
    description: DESCRIPTION,
    inLanguage: "fr-FR",
  };

  const organizationSchema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: APP_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/images/logos/sums-saas-boilerplate-logo-dark.svg`,
    },
    // sameAs: ["https://twitter.com/...", "https://linkedin.com/..."],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <main className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold">Hello World</h1>
      </main>
    </>
  );
}
