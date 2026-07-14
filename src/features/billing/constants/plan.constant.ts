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

/**
 * Returns the plan's display label (a proper noun, e.g. "Pro" — identical in
 * every locale, no translation needed), or `null` when the price ID is
 * unknown. Callers render the locale-aware fallback (e.g. `t("planUnknown")`)
 * themselves.
 */
function getPlanLabel(priceId: string | null): string | null {
  if (!priceId) {
    return null;
  }

  const plan = Object.values(PLAN_CONFIG).find(
    (config) => config.priceId === priceId,
  );

  return plan?.label ?? null;
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

/**
 * Resolves a Stripe price ID back to its plan key ("pro", ...), or `null` when
 * the price is unknown. Used to derive an organization's current plan from its
 * active subscription (the single source of truth) rather than a stored column.
 */
function getPlanKeyByPriceId(priceId: string): PlanKey | null {
  const entry = Object.entries(PLAN_CONFIG).find(
    ([, config]) => config.priceId === priceId,
  );

  return (entry?.[0] as PlanKey) ?? null;
}

export {
  ALLOWED_PRICE_IDS,
  getPlanByPriceId,
  getPlanKeyByPriceId,
  getPlanLabel,
  getPriceIds,
  getSeatsIncluded,
  PLAN_CONFIG,
};

export type { PlanFeature, PlanKey };
