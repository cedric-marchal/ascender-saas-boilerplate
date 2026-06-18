import type { PlanKey } from "@/features/billing/constants/plan.constant";

/**
 * Feature gating matrix — maps each feature key to the plans that include it.
 * NEVER hardcode plan names outside this file and PLAN_CONFIG.
 */
const FEATURE_CONFIG = {
  advanced_analytics: {
    plans: ["pro"] as PlanKey[],
    label: "Analytiques avancées",
  },
  api_access: {
    plans: ["pro"] as PlanKey[],
    label: "Accès API",
  },
  priority_support: {
    plans: ["pro"] as PlanKey[],
    label: "Support prioritaire",
  },
} as const satisfies Record<
  string,
  {
    plans: PlanKey[];
    label: string;
  }
>;

type FeatureKey = keyof typeof FEATURE_CONFIG;

export { FEATURE_CONFIG };
export type { FeatureKey };
