import "server-only";

import type {
  UserRoleFilter,
  UserSortableField,
  VerificationFilter,
} from "@/features/users/constants/users-filters.constant";

import type { User, UserRole } from "@/lib/generated/prisma/client";
import type { UserWhereInput } from "@/lib/generated/prisma/models";
import { PAGE_SIZE, type SortOrder } from "@/lib/parsers/filters";
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
    | "id"
    | "name"
    | "email"
    | "role"
    | "emailVerified"
    | "image"
    | "slug"
    | "createdAt"
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
        slug: true,
        createdAt: true,
      },
      orderBy: { [filters.sortBy]: filters.order },
      skip: (filters.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: filters.page,
  };
}

export { getUsers };

export type { GetUsersFilters, GetUsersResult };
