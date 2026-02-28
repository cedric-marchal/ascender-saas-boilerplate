import type { Product, WebPage, WithContext } from "schema-dts";

import { PLANS, type Plan } from "@/features/pricing/constants/pricing-plans";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

const PRICING_DESCRIPTION = `Découvrez les tarifs de ${APP_NAME} : offres flexibles pour les indépendants, équipes et entreprises, sans engagement.`;
const PRICING_KEYWORDS = [
  "tarifs",
  "prix",
  "abonnements",
  APP_NAME.toLowerCase(),
  "saas pricing",
];

function getPricingWebPageSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/tarifs/#webpage`,
    name: `Tarifs | ${APP_NAME}`,
    description: PRICING_DESCRIPTION,
    url: `${BASE_URL}/tarifs`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

function getPricingProductSchemas(): WithContext<Product>[] {
  return PLANS.filter((plan: Plan) => plan.price !== "Sur mesure").map(
    (plan: Plan) => ({
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
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        )
          .toISOString()
          .split("T")[0],
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}/tarifs`,
      },
    }),
  );
}

export {
  getPricingProductSchemas,
  getPricingWebPageSchema,
  PRICING_DESCRIPTION,
  PRICING_KEYWORDS,
};
