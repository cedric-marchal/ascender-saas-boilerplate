import "server-only";

import { prisma } from "@/lib/prisma";

type IsLastOwnerInput = {
  organizationId: string;
  userId: string;
};

async function isLastOwner(input: IsLastOwnerInput): Promise<boolean> {
  const ownerCount = await prisma.member.count({
    where: {
      organizationId: input.organizationId,
      role: "owner",
    },
  });

  if (ownerCount > 1) {
    return false;
  }

  const isOwner = await prisma.member.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      role: "owner",
    },
    select: {
      id: true,
    },
  });

  return Boolean(isOwner);
}

export { isLastOwner };
