import { getPathname } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import type { ContactPage as ContactPageSchema, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

function getContactSchema(
  locale: Locale,
  description: string,
): WithContext<ContactPageSchema> {
  const pathname = getPathname({ href: "/contact", locale });

  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${BASE_URL}${pathname}/#webpage`,
    name: `${APP_NAME}`,
    description,
    url: `${BASE_URL}${pathname}`,
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

export { getContactSchema };
