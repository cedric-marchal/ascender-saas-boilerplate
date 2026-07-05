"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { TransferOwnershipSchema } from "@/features/organizations/schemas/member.schema";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

const transferOwnershipAction = orgActionClient
  .inputSchema(TransferOwnershipSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner") {
      throw new ForbiddenError(
        "Seul le propriétaire peut transférer la propriété de l'organisation",
      );
    }

    const targetMember = await prisma.member.findFirst({
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

    if (!targetMember) {
      throw new NotFoundError("Membre introuvable");
    }

    if (targetMember.userId === ctx.userId) {
      throw new ForbiddenError(
        "Vous êtes déjà propriétaire de cette organisation",
      );
    }

    const currentOwnerMember = await prisma.member.findFirst({
      where: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        role: "owner",
      },
      select: {
        id: true,
      },
    });

    if (!currentOwnerMember) {
      throw new NotFoundError("Votre membre introuvable dans l'organisation");
    }

    await prisma.$transaction([
      prisma.member.update({
        where: {
          id: currentOwnerMember.id,
        },
        data: {
          role: "admin",
        },
      }),
      prisma.member.update({
        where: {
          id: targetMember.id,
        },
        data: {
          role: "owner",
        },
      }),
    ]);

    await logEvent({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: AUDIT_ACTION.OWNERSHIP_TRANSFERRED,
      entityType: "organization",
      entityId: ctx.organizationId,
      metadata: {
        previousOwnerId: ctx.userId,
        newOwnerId: targetMember.userId,
      },
    });

    revalidateLocalizedPath("/dashboard/organization");

    return {
      success: true,
    };
  });

export { transferOwnershipAction };
