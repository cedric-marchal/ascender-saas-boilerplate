import { env } from "@/lib/env";

/**
 * Centralized plan configuration — single source of truth for all plan-related
 * lookups (checkout validation, UI labels, access guards, seat caps, feature gating).
 *
 * To add a new paid plan:
 * 1. Add the env var in lib/env.ts (e.g. STRIPE_PRICE_ID_BUSINESS)
 * 2. Add an entry below in PLAN_CONFIG
 * 3. Add the plan object in features/pricing/constants/pricing-plans.ts
 */
const PLAN_CONFIG = {
  pro: {
    priceId: env.STRIPE_PRICE_ID_PRO,
    label: "Pro",
    seatsIncluded: 5,
    features: ["advanced_analytics", "api_access", "priority_support"] as const,
  },
} as const satisfies Record<
  string,
  {
    priceId: string;
    label: string;
    seatsIncluded: number;
    features: readonly string[];
  }
>;

type PlanKey = keyof typeof PLAN_CONFIG;

type PlanFeature = (typeof PLAN_CONFIG)[PlanKey]["features"][number];

const ALLOWED_PRICE_IDS: string[] = Object.values(PLAN_CONFIG).map(
  (plan) => plan.priceId,
);

function getPlanLabel(priceId: string | null): string {
  if (!priceId) {
    return "Inconnu";
  }

  const plan = Object.values(PLAN_CONFIG).find(
    (config) => config.priceId === priceId,
  );

  return plan?.label ?? "Inconnu";
}

function getPriceIds(...plans: PlanKey[]): string[] {
  return plans.map((key: PlanKey) => PLAN_CONFIG[key].priceId);
}

function getSeatsIncluded(planKey: PlanKey): number {
  return PLAN_CONFIG[planKey].seatsIncluded;
}

function getPlanByPriceId(
  priceId: string,
): (typeof PLAN_CONFIG)[PlanKey] | undefined {
  return Object.values(PLAN_CONFIG).find(
    (config) => config.priceId === priceId,
  );
}

export {
  ALLOWED_PRICE_IDS,
  getPlanByPriceId,
  getPlanLabel,
  getPriceIds,
  getSeatsIncluded,
  PLAN_CONFIG,
};

export type { PlanFeature, PlanKey };
