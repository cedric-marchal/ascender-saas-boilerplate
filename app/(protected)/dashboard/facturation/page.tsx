import type { Metadata } from "next";

import { BillingEmptyPage } from "@/features/billing/pages/billing-empty-page";
import { OrganizationBillingPage } from "@/features/billing/pages/organization-billing-page";
import { getBilling } from "@/features/billing/services/get-billing.service";

import { prisma } from "@/lib/prisma";
import { filterRatelimit } from "@/lib/ratelimit";
import { requireCustomerVerifiedEmail } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

import { ForbiddenError } from "@/utils/errors/errors";

export const metadata: Metadata = {
  title: "Facturation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardBillingRoute() {
  const session = await requireCustomerVerifiedEmail();

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const organizationId = session.activeOrganizationId;

  if (!organizationId) {
    return <BillingEmptyPage />;
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
      role: {
        in: ["owner", "admin"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Seuls les propriétaires et administrateurs peuvent accéder à la facturation",
    );
  }

  const [billing, organization, memberCount] = await Promise.all([
    getBilling(organizationId),
    prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        name: true,
        plan: true,
      },
    }),
    prisma.member.count({
      where: {
        organizationId,
      },
    }),
  ]);

  if (!billing || !organization) {
    return <BillingEmptyPage />;
  }

  return (
    <OrganizationBillingPage
      billing={billing}
      organizationName={organization.name}
      memberCount={memberCount}
      plan={organization.plan}
    />
  );
}
