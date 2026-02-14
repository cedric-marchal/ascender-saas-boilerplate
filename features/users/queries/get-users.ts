import "server-only";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";
import {
  type UserRoleFilter,
  type UserSortableField,
  type VerificationFilter,
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  usersSortableFields,
} from "@/features/users/constants";
import type { User } from "@/lib/generated/prisma/client";
import type { UserWhereInput } from "@/lib/generated/prisma/models";
import type { SortOrder } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = PAGINATION.defaultPageSize;

type GetUsersFilters = {
  search: string;
  role: string;
  verified: string;
  sortBy: string;
  order: string;
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
  const safeSearch = filters.search.slice(0, FILTERS.maxSearchLength).trim();
  const safePage = Math.max(1, Math.min(filters.page, PAGINATION.maxPage));

  const safeRole: UserRoleFilter = isUserRoleFilter(filters.role)
    ? filters.role
    : "all";

  const safeVerified: VerificationFilter = isVerificationFilter(
    filters.verified
  )
    ? filters.verified
    : "all";

  const safeSortBy: UserSortableField = (
    usersSortableFields as readonly string[]
  ).includes(filters.sortBy)
    ? (filters.sortBy as UserSortableField)
    : (SORTING.defaultSortBy as UserSortableField);

  const safeOrder: SortOrder = (SORTING.orders as readonly string[]).includes(
    filters.order
  )
    ? (filters.order as SortOrder)
    : SORTING.defaultOrder;

  const whereClause: UserWhereInput = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(safeRole !== "all" && isUserRole(safeRole) && { role: safeRole }),
    ...(safeVerified === "verified" && { emailVerified: true }),
    ...(safeVerified === "unverified" && { emailVerified: false }),
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
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export { getUsers };

export type { GetUsersFilters, GetUsersResult };
