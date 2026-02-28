import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

// Legal Notice (mentions-legales)
const LEGAL_NOTICE_DESCRIPTION = `Mentions légales de ${APP_NAME}. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site.`;

function getLegalNoticeSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/mentions-legales/#webpage`,
    name: `Mentions légales | ${APP_NAME}`,
    description: LEGAL_NOTICE_DESCRIPTION,
    url: `${BASE_URL}/mentions-legales`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Privacy Policy (politique-de-confidentialite)
const PRIVACY_POLICY_DESCRIPTION = `Politique de confidentialité de ${APP_NAME}. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.`;

function getPrivacyPolicySchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/politique-de-confidentialite/#webpage`,
    name: `Politique de confidentialité | ${APP_NAME}`,
    description: PRIVACY_POLICY_DESCRIPTION,
    url: `${BASE_URL}/politique-de-confidentialite`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Cookie Policy (politique-des-cookies)
const COOKIE_POLICY_DESCRIPTION = `Politique des cookies de ${APP_NAME}. Découvrez les cookies utilisés sur notre site et comment gérer vos préférences.`;

function getCookiePolicySchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/politique-des-cookies/#webpage`,
    name: `Politique des cookies | ${APP_NAME}`,
    description: COOKIE_POLICY_DESCRIPTION,
    url: `${BASE_URL}/politique-des-cookies`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Terms of Service (conditions-d-utilisation)
const TERMS_OF_SERVICE_DESCRIPTION = `Conditions d'utilisation de ${APP_NAME}. Lisez les règles et obligations régissant l'utilisation de notre service.`;

function getTermsOfServiceSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/conditions-d-utilisation/#webpage`,
    name: `Conditions d'utilisation | ${APP_NAME}`,
    description: TERMS_OF_SERVICE_DESCRIPTION,
    url: `${BASE_URL}/conditions-d-utilisation`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Terms of Sale (conditions-de-vente)
const TERMS_OF_SALE_DESCRIPTION = `Conditions de vente de ${APP_NAME}. Découvrez les termes régissant les achats et abonnements sur notre plateforme.`;

function getTermsOfSaleSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/conditions-de-vente/#webpage`,
    name: `Conditions de vente | ${APP_NAME}`,
    description: TERMS_OF_SALE_DESCRIPTION,
    url: `${BASE_URL}/conditions-de-vente`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

export {
  COOKIE_POLICY_DESCRIPTION,
  getCookiePolicySchema,
  LEGAL_NOTICE_DESCRIPTION,
  getLegalNoticeSchema,
  PRIVACY_POLICY_DESCRIPTION,
  getPrivacyPolicySchema,
  TERMS_OF_SALE_DESCRIPTION,
  getTermsOfSaleSchema,
  TERMS_OF_SERVICE_DESCRIPTION,
  getTermsOfServiceSchema,
};
