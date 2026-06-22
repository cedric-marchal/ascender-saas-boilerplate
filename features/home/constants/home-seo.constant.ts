import type { Organization, WebSite, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

const HOME_DESCRIPTION =
  "Découvrez les solutions innovantes de Next SaaS Boilerplate pour transformer votre entreprise.";

function getHomeWebsiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: APP_NAME,
    url: BASE_URL,
    description: HOME_DESCRIPTION,
    inLanguage: "fr-FR",
  };
}

function getHomeOrganizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: APP_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/images/logos/next-saas-boilerplate-logo-dark.svg`,
    },
  };
}

export { getHomeOrganizationSchema, getHomeWebsiteSchema };
