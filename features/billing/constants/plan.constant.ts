import { env } from "@/lib/env";

/**
 * Centralized plan configuration — single source of truth for all plan-related
 * lookups (checkout validation, UI labels, access guards).
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
  },
} as const satisfies Record<
  string,
  {
    priceId: string;
    label: string;
  }
>;

type PlanKey = keyof typeof PLAN_CONFIG;

const ALLOWED_PRICE_IDS: string[] = Object.values(PLAN_CONFIG).map(
  (plan: { priceId: string; label: string }) => plan.priceId,
);

function getPlanLabel(priceId: string | null): string {
  if (!priceId) {
    return "Inconnu";
  }

  const plan = Object.values(PLAN_CONFIG).find(
    (config: { priceId: string; label: string }) => config.priceId === priceId,
  );

  return plan?.label ?? "Inconnu";
}

function getPriceIds(...plans: PlanKey[]): string[] {
  return plans.map((key: PlanKey) => PLAN_CONFIG[key].priceId);
}

export { ALLOWED_PRICE_IDS, getPlanLabel, getPriceIds, PLAN_CONFIG };
export type { PlanKey };
