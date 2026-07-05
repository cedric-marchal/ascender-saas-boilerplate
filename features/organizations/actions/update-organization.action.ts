"use server";

import { revalidatePath } from "next/cache";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { UpdateOrganizationSchema } from "@/features/organizations/schemas/organization.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

const updateOrganizationAction = orgActionClient
  .inputSchema(UpdateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError("errors.organizations.updateForbidden");
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: ctx.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      throw new NotFoundError("errors.organizations.notFound");
    }

    await prisma.organization.update({
      where: {
        id: ctx.organizationId,
      },
      data: {
        ...(parsedInput.name !== undefined && { name: parsedInput.name }),
        ...(parsedInput.logo !== undefined && { logo: parsedInput.logo }),
      },
      select: {
        id: true,
      },
    });

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.ORG_UPDATED,
      entityType: "organization",
      entityId: ctx.organizationId,
      metadata: {
        ...(parsedInput.name !== undefined && { name: parsedInput.name }),
        ...(parsedInput.logo !== undefined && { logo: parsedInput.logo }),
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  });

export { updateOrganizationAction };
