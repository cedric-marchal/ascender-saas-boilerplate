import "server-only";

import { prisma } from "@/lib/prisma";

const MAX_USER_ORGANIZATIONS = 50;

type GetUserOrganizationsInput = {
  userId: string;
};

type UserOrganizationItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
  createdAt: Date;
};

async function getUserOrganizations(
  input: GetUserOrganizationsInput,
): Promise<UserOrganizationItem[]> {
  const members = await prisma.member.findMany({
    where: {
      userId: input.userId,
    },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: MAX_USER_ORGANIZATIONS,
  });

  return members.map((member) => ({
    id: member.organization.id,
    name: member.organization.name,
    slug: member.organization.slug,
    logo: member.organization.logo,
    role: member.role,
    createdAt: member.organization.createdAt,
  }));
}

export { getUserOrganizations };
export type { UserOrganizationItem };
