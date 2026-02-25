import "server-only";

import type {
  UserRoleFilter,
  UserSortableField,
  VerificationFilter,
} from "@/features/users/constants/users-filters.constant";

import type { User, UserRole } from "@/lib/generated/prisma/client";
import type { UserWhereInput } from "@/lib/generated/prisma/models";
import { DEFAULT_PAGE_SIZE, type SortOrder } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

type GetUsersFilters = {
  search: string;
  role: UserRoleFilter;
  verified: VerificationFilter;
  sortBy: UserSortableField;
  order: SortOrder;
  page: number;
};

type GetUsersResult = {
  users: Pick<
    User,
    "id" | "name" | "email" | "role" | "emailVerified" | "image" | "createdAt"
  >[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getUsers(filters: GetUsersFilters): Promise<GetUsersResult> {
  const whereClause: UserWhereInput = {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { email: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
    ...(filters.role !== "all" && { role: filters.role as UserRole }),
    ...(filters.verified === "verified" && { emailVerified: true }),
    ...(filters.verified === "unverified" && { emailVerified: false }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
      orderBy: { [filters.sortBy]: filters.order },
      skip: (filters.page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: filters.page,
  };
}

export { getUsers };

export type { GetUsersFilters, GetUsersResult };
