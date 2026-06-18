import "server-only";

import { prisma } from "@/lib/prisma";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

type GetOrganizationInput = {
  userId: string;
  organizationId: string;
};

type GetOrganizationResult = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  role: string;
};

async function getOrganization(
  input: GetOrganizationInput,
): Promise<GetOrganizationResult> {
  const [organization, memberCount] = await prisma.$transaction([
    prisma.organization.findUnique({
      where: {
        id: input.organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        members: {
          where: {
            userId: input.userId,
          },
          select: {
            role: true,
          },
          take: 1,
        },
      },
    }),
    prisma.member.count({
      where: {
        organizationId: input.organizationId,
      },
    }),
  ]);

  if (!organization) {
    throw new NotFoundError("Organisation introuvable");
  }

  const currentMember = organization.members[0];

  if (!currentMember) {
    throw new ForbiddenError("Vous n'êtes pas membre de cette organisation");
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    createdAt: organization.createdAt,
    memberCount,
    role: currentMember.role,
  };
}

export { getOrganization };
export type { GetOrganizationResult };
