import "server-only";

import {
  type UserRoleFilter,
  type UserSortableField,
  type VerificationFilter,
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  usersSortableFields,
} from "@/features/users/constants/users-filters.constant";

import type { User } from "@/lib/generated/prisma/client";
import type { UserWhereInput } from "@/lib/generated/prisma/models";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  SORT_ORDERS,
  type SortOrder,
} from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";
import { filterRatelimit } from "@/lib/ratelimit";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

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

async function getUsers(
  filters: GetUsersFilters,
  userId: string
): Promise<GetUsersResult> {
  await checkRatelimit(filterRatelimit, userId);

  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));

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
    : (DEFAULT_SORT_BY as UserSortableField);

  const safeOrder: SortOrder = (SORT_ORDERS as readonly string[]).includes(
    filters.order
  )
    ? (filters.order as SortOrder)
    : DEFAULT_SORT_ORDER;

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
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export { getUsers };

export type { GetUsersFilters, GetUsersResult };
