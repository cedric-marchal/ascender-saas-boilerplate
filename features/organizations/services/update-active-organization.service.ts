import "server-only";

import { prisma } from "@/lib/prisma";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

type UpdateActiveOrganizationInput = {
  userId: string;
  sessionId: string;
  organizationId: string;
};

async function updateActiveOrganization(
  input: UpdateActiveOrganizationInput,
): Promise<void> {
  const membership = await prisma.member.findFirst({
    where: {
      userId: input.userId,
      organizationId: input.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Vous n'êtes pas membre de cette organisation");
  }

  const session = await prisma.session.findUnique({
    where: {
      id: input.sessionId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    throw new NotFoundError("Session introuvable");
  }

  await prisma.session.update({
    where: {
      id: input.sessionId,
    },
    data: {
      activeOrganizationId: input.organizationId,
    },
  });
}

export { updateActiveOrganization };
