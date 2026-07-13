import "server-only";

import type { OrganizationSortableField } from "@/features/admin/constants/organizations-filters.constant";

import type { Organization } from "@/lib/generated/prisma/client";
import type { OrganizationWhereInput } from "@/lib/generated/prisma/models";
import { PAGE_SIZE, type SortOrder } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

type GetOrganizationsFilters = {
  search: string;
  sortBy: OrganizationSortableField;
  order: SortOrder;
  page: number;
};

type OrganizationRow = {
  id: Organization["id"];
  name: Organization["name"];
  slug: Organization["slug"];
  plan: Organization["plan"];
  createdAt: Organization["createdAt"];
  memberCount: number;
  ownerEmail: string | null;
};

type GetOrganizationsResult = {
  organizations: OrganizationRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getOrganizations(
  filters: GetOrganizationsFilters,
): Promise<GetOrganizationsResult> {
  const whereClause: OrganizationWhereInput = {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { slug: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [rawOrganizations, totalCount] = await prisma.$transaction([
    prisma.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        // Bounded owner lookup: at most 1 row, only owner role
        members: {
          where: {
            role: "owner",
          },
          take: 1,
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        // Aggregate count — no unbounded fetch of all member rows
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        [filters.sortBy]: filters.order,
      },
      skip: (filters.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.organization.count({
      where: whereClause,
    }),
  ]);

  const organizations: OrganizationRow[] = rawOrganizations.map(
    (organization) => {
      const ownerMember = organization.members[0];

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        createdAt: organization.createdAt,
        memberCount: organization._count.members,
        ownerEmail: ownerMember?.user.email ?? null,
      };
    },
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    organizations,
    totalCount,
    totalPages,
    currentPage: filters.page,
  };
}

export { getOrganizations };

export type {
  GetOrganizationsFilters,
  GetOrganizationsResult,
  OrganizationRow,
};
