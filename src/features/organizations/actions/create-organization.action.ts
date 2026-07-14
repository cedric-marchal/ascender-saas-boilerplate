"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { CreateOrganizationSchema } from "@/features/organizations/schemas/organization.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";
import { generateUniqueOrgSlug } from "@/features/organizations/services/create-organization.service";

import { auth } from "@/lib/auth";
import { organizationRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const createOrganizationAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(organizationRatelimit, ctx.userId);

    return next();
  })
  .inputSchema(CreateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const slug = await generateUniqueOrgSlug(parsedInput.name);

    // Better Auth adds the creator as an "owner" member and (via the
    // afterCreateOrganization hook) provisions the org's Stripe customer.
    // keepCurrentActiveOrganization defaults to false → the new org becomes active.
    const organization = await auth.api.createOrganization({
      body: {
        name: parsedInput.name,
        slug,
      },
      headers: await headers(),
    });

    if (organization) {
      await logEvent({
        organizationId: organization.id,
        userId: ctx.userId,
        action: AUDIT_ACTION.ORG_CREATED,
        entityType: "organization",
        entityId: organization.id,
        metadata: {
          name: organization.name,
        },
      });
    }

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  });

export { createOrganizationAction };
