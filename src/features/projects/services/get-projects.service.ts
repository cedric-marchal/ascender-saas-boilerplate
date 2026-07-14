import "server-only";

import type {
  ProjectSortableField,
  ProjectStatusFilter,
} from "@/features/projects/constants/project-filters.constant";

import type { ProjectStatus } from "@/lib/generated/prisma/client";
import { PAGE_SIZE, type SortOrder } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

type GetProjectsInput = {
  organizationId: string;
  userId: string;
  search: string;
  status: ProjectStatusFilter;
  sortBy: ProjectSortableField;
  order: SortOrder;
  page: number;
};

type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

type GetProjectsResult = {
  projects: ProjectItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getProjects(
  input: GetProjectsInput,
): Promise<GetProjectsResult> {
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
        name: {
          contains: input.search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const statusFilter = input.status !== "all" ? { status: input.status } : {};

  const whereClause = {
    organizationId: input.organizationId,
    ...searchFilter,
    ...statusFilter,
  };

  const [projects, totalCount] = await prisma.$transaction([
    prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [input.sortBy]: input.order,
      },
      skip: (input.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.project.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    projects,
    totalCount,
    totalPages,
    currentPage: input.page,
  };
}

export { getProjects };
export type { GetProjectsInput, GetProjectsResult, ProjectItem };
