import "server-only";

import { notFound } from "next/navigation";

import { type FeatureKey } from "@/features/organizations/constants/feature-config.constant";
import { canUse } from "@/features/organizations/services/can-use.service";

/**
 * Guards a page behind a specific feature gate.
 * Redirects to 404 if the organization does not have an active subscription
 * that includes the requested feature.
 */
async function requireOrganizationFeature(
  organizationId: string,
  feature: FeatureKey,
): Promise<void> {
  const isAllowed = await canUse(organizationId, feature);

  if (!isAllowed) {
    notFound();
  }
}

export { requireOrganizationFeature };
