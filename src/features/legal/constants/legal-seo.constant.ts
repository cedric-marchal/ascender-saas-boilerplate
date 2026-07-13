import { getPathname } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

type LegalPageHref =
  | "/legal-notice"
  | "/privacy-policy"
  | "/cookie-policy"
  | "/terms-of-service"
  | "/terms-of-sale";

function getLegalPageSchema(
  href: LegalPageHref,
  locale: Locale,
  name: string,
  description: string,
): WithContext<WebPage> {
  const pathname = getPathname({ href, locale });

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${pathname}/#webpage`,
    name,
    description,
    url: `${BASE_URL}${pathname}`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

export { getLegalPageSchema };
export type { LegalPageHref };
