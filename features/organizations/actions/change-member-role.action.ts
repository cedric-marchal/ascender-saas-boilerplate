"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { ChangeMemberRoleSchema } from "@/features/organizations/schemas/member.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

const changeMemberRoleAction = orgActionClient
  .inputSchema(ChangeMemberRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError("errors.organizations.changeRoleForbidden");
    }

    // The last-owner check and the role update run in a single Serializable
    // transaction so two concurrent demotions of the org's owners cannot both
    // pass the guard and leave the org with zero owners.
    const previousRole = await prisma.$transaction(
      async (tx) => {
        const member = await tx.member.findFirst({
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
          if (ctx.memberRole !== "owner") {
            throw new ForbiddenError(
              "errors.organizations.changeOwnerRoleForbidden",
            );
          }

          const remainingOwners = await tx.member.count({
            where: {
              organizationId: ctx.organizationId,
              role: "owner",
              id: {
                not: member.id,
              },
            },
          });

          if (remainingOwners < 1) {
            throw new ForbiddenError(
              "errors.organizations.cannotDemoteLastOwner",
            );
          }
        }

        await tx.member.update({
          where: {
            id: member.id,
          },
          data: {
            role: parsedInput.role,
          },
          select: {
            id: true,
          },
        });

        return member.role;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.ROLE_CHANGED,
      entityType: "member",
      entityId: parsedInput.memberId,
      metadata: {
        previousRole,
        newRole: parsedInput.role,
      },
    });

    revalidateLocalizedPath("/dashboard/organization");

    return {
      success: true,
    };
  });

export { changeMemberRoleAction };
