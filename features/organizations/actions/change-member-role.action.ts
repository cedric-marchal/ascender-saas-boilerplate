"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { ChangeMemberRoleSchema } from "@/features/organizations/schemas/member.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";
import { isLastOwner } from "@/features/organizations/services/is-last-owner.service";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

const changeMemberRoleAction = orgActionClient
  .inputSchema(ChangeMemberRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError("errors.organizations.changeRoleForbidden");
    }

    const member = await prisma.member.findFirst({
      where: {
        id: parsedInput.memberId,
        organizationId: ctx.organizationId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundError("errors.organizations.memberNotFound");
    }

    if (member.role === "owner") {
      const lastOwner = await isLastOwner({
        organizationId: ctx.organizationId,
        userId: member.userId,
      });

      if (lastOwner) {
        throw new ForbiddenError("errors.organizations.cannotDemoteLastOwner");
      }
    }

    await prisma.member.update({
      where: {
        id: parsedInput.memberId,
      },
      data: {
        role: parsedInput.role,
      },
      select: {
        id: true,
      },
    });

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.ROLE_CHANGED,
      entityType: "member",
      entityId: parsedInput.memberId,
      metadata: {
        previousRole: member.role,
        newRole: parsedInput.role,
        targetUserId: member.userId,
      },
    });

    revalidateLocalizedPath("/dashboard/organization");

    return {
      success: true,
    };
  });

export { changeMemberRoleAction };
