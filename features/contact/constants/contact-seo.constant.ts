import type { ContactPage as ContactPageSchema, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

const CONTACT_DESCRIPTION = `Contactez l'équipe ${APP_NAME}. Une question, un projet ou un besoin spécifique ? Nous vous répondons sous 24h.`;
const CONTACT_KEYWORDS = [
  "contact",
  APP_NAME.toLowerCase(),
  "support",
  "aide",
  "question",
];

function getContactSchema(): WithContext<ContactPageSchema> {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${BASE_URL}/contact/#webpage`,
    name: `Contact | ${APP_NAME}`,
    description: CONTACT_DESCRIPTION,
    url: `${BASE_URL}/contact`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
    mainEntity: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: APP_NAME,
      url: BASE_URL,
      email: "contact@example.com",
    },
  };
}

export { CONTACT_DESCRIPTION, CONTACT_KEYWORDS, getContactSchema };
