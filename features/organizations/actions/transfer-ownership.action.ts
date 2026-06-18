"use server";

import { revalidatePath } from "next/cache";

import { TransferOwnershipSchema } from "@/features/organizations/schemas/member.schema";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

export const transferOwnershipAction = orgActionClient
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

    revalidatePath("/dashboard/organisation");

    return {
      success: true,
    };
  });
