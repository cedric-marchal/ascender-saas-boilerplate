import "server-only";

import type {
  MemberRoleFilter,
  MemberSortableField,
} from "@/features/organizations/constants/members-filters.constant";

import { PAGE_SIZE, type SortOrder } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

type GetOrganizationMembersInput = {
  organizationId: string;
  userId: string;
  search: string;
  role: MemberRoleFilter;
  sortBy: MemberSortableField;
  order: SortOrder;
  page: number;
};

type MemberItem = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

type GetOrganizationMembersResult = {
  members: MemberItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getOrganizationMembers(
  input: GetOrganizationMembersInput,
): Promise<GetOrganizationMembersResult> {
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("errors.common.notOrganizationMember");
  }

  const searchFilter = input.search
    ? {
        user: {
          OR: [
            {
              name: { contains: input.search, mode: "insensitive" as const },
            },
            {
              email: { contains: input.search, mode: "insensitive" as const },
            },
          ],
        },
      }
    : {};

  const roleFilter = input.role !== "all" ? { role: input.role } : {};

  const whereClause = {
    organizationId: input.organizationId,
    ...searchFilter,
    ...roleFilter,
  };

  const orderByClause =
    input.sortBy === "name" || input.sortBy === "email"
      ? { user: { [input.sortBy]: input.order } }
      : { [input.sortBy]: input.order };

  const [members, totalCount] = await prisma.$transaction([
    prisma.member.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: orderByClause,
      skip: (input.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.member.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    members,
    totalCount,
    totalPages,
    currentPage: input.page,
  };
}

export { getOrganizationMembers };
export type {
  GetOrganizationMembersInput,
  GetOrganizationMembersResult,
  MemberItem,
};
