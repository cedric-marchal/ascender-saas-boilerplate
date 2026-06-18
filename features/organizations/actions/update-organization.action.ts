"use server";

import { revalidatePath } from "next/cache";

import { UpdateOrganizationSchema } from "@/features/organizations/schemas/organization.schema";

import { prisma } from "@/lib/prisma";
import { orgActionClient } from "@/lib/safe-action";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

export const updateOrganizationAction = orgActionClient
  .inputSchema(UpdateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.memberRole !== "owner" && ctx.memberRole !== "admin") {
      throw new ForbiddenError(
        "Seuls les propriétaires et administrateurs peuvent modifier l'organisation",
      );
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
      throw new NotFoundError("Organisation introuvable");
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

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  });
