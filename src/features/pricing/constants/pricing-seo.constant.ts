import { getPathname } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import type { Product, WebPage, WithContext } from "schema-dts";

import { type Plan } from "@/features/pricing/constants/pricing-plans";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

function getPricingWebPageSchema(
  locale: Locale,
  description: string,
): WithContext<WebPage> {
  const pathname = getPathname({ href: "/pricing", locale });

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${pathname}/#webpage`,
    name: `${APP_NAME}`,
    description,
    url: `${BASE_URL}${pathname}`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

function getPricingProductSchemas(
  locale: Locale,
  plans: Plan[],
): WithContext<Product>[] {
  const pathname = getPathname({ href: "/pricing", locale });

  return plans
    .filter((plan: Plan) => !plan.isCustomPrice)
    .map((plan: Plan) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${APP_NAME} ${plan.name}`,
      description: plan.description,
      brand: {
        "@type": "Brand",
        name: APP_NAME,
      },
      offers: {
        "@type": "Offer",
        price: plan.price,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}${pathname}`,
      },
    }));
}

export { getPricingProductSchemas, getPricingWebPageSchema };
