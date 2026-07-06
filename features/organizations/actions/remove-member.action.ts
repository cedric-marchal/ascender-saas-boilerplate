"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { RemoveMemberSchema } from "@/features/organizations/schemas/member.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

const removeMemberAction = orgActionClient
  .inputSchema(RemoveMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError("errors.organizations.removeMembersForbidden");
    }

    // The last-owner check and the delete run in a single Serializable
    // transaction: concurrent requests (two owners removing each other) can no
    // longer both read "2 owners remain" and both delete, leaving the org with
    // zero owners — Postgres aborts one of the conflicting transactions.
    const removedMember = await prisma.$transaction(
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
              "errors.organizations.removeOwnerForbidden",
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
              "errors.organizations.cannotRemoveLastOwner",
            );
          }
        }

        await tx.member.delete({
          where: {
            id: member.id,
          },
        });

        return member;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.MEMBER_REMOVED,
      entityType: "member",
      entityId: parsedInput.memberId,
      metadata: {
        removedUserId: removedMember.userId,
        removedRole: removedMember.role,
      },
    });

    revalidateLocalizedPath("/dashboard/organization");

    return {
      success: true,
    };
  });

export { removeMemberAction };
