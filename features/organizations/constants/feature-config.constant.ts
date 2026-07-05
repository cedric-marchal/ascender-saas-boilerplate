import type { PlanKey } from "@/features/billing/constants/plan.constant";

/**
 * Feature gating matrix — maps each feature key to the plans that include it.
 * NEVER hardcode plan names outside this file and PLAN_CONFIG.
 *
 * `label` is a translation KEY (resolved against the
 * `organizations.featureLabels` message namespace via `useTranslations`),
 * not literal text.
 */
const FEATURE_CONFIG = {
  advanced_analytics: {
    plans: ["pro"] as PlanKey[],
    label: "advancedAnalytics",
  },
  api_access: {
    plans: ["pro"] as PlanKey[],
    label: "apiAccess",
  },
  priority_support: {
    plans: ["pro"] as PlanKey[],
    label: "prioritySupport",
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
