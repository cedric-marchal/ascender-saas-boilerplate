import { getTranslations } from "next-intl/server";

import { env } from "@/lib/env";

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string | null;
  features: string[];
  cta: string;
  priceId: string | null;
  featured: boolean;
  isFree: boolean;
  isCustomPrice: boolean;
};

/**
 * Plan copy (name, description, features, cta) is locale-dependent, so the
 * static `PLANS` array became an async getter resolved from the `pricing`
 * message namespace. Non-copy fields (`price`, `priceId`, `featured`,
 * `isFree`) never vary by locale.
 */
async function getPricingPlans(): Promise<Plan[]> {
  const t = await getTranslations("pricing");
  const appName = env.NEXT_PUBLIC_APP_NAME;
  const monthlyPeriod = t("monthlyPeriod");
  const customPrice = t("customPrice");

  return [
    {
      name: t("plans.starter.name"),
      description: t("plans.starter.description"),
      price: "0",
      period: monthlyPeriod,
      features: t.raw("plans.starter.features") as string[],
      cta: t("plans.starter.cta"),
      priceId: null,
      featured: false,
      isFree: true,
      isCustomPrice: false,
    },
    {
      name: t("plans.pro.name"),
      description: t("plans.pro.description", { appName }),
      price: "19",
      period: monthlyPeriod,
      features: t.raw("plans.pro.features") as string[],
      cta: t("plans.pro.cta"),
      priceId: env.STRIPE_PRICE_ID_PRO,
      featured: true,
      isFree: false,
      isCustomPrice: false,
    },
    {
      name: t("plans.business.name"),
      description: t("plans.business.description"),
      price: customPrice,
      period: null,
      features: t.raw("plans.business.features") as string[],
      cta: t("plans.business.cta"),
      priceId: null,
      featured: false,
      isFree: false,
      isCustomPrice: true,
    },
  ];
}

export { getPricingPlans };
export type { Plan };
