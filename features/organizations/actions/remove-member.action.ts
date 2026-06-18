"use server";

import { revalidatePath } from "next/cache";

import { RemoveMemberSchema } from "@/features/organizations/schemas/member.schema";
import { isLastOwner } from "@/features/organizations/services/is-last-owner.service";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

export const removeMemberAction = orgActionClient
  .inputSchema(RemoveMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent retirer des membres",
      );
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
      throw new NotFoundError("Membre introuvable");
    }

    if (member.role === "owner") {
      const lastOwner = await isLastOwner({
        organizationId: ctx.organizationId,
        userId: member.userId,
      });

      if (lastOwner) {
        throw new ForbiddenError(
          "Impossible de retirer le dernier propriétaire. Transférez d'abord la propriété.",
        );
      }
    }

    await prisma.$transaction([
      prisma.member.delete({
        where: {
          id: parsedInput.memberId,
        },
      }),
      prisma.organization.update({
        where: {
          id: ctx.organizationId,
        },
        data: {
          seatsUsed: {
            decrement: 1,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard/organisation");

    return {
      success: true,
    };
  });
