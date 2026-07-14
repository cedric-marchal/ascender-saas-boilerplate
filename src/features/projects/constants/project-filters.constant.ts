import { ProjectStatus } from "@/lib/generated/prisma/browser";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type ProjectStatusFilter = "all" | ProjectStatus;

const projectStatuses = [
  ProjectStatus.DRAFT,
  ProjectStatus.ACTIVE,
  ProjectStatus.ARCHIVED,
] as const satisfies readonly ProjectStatus[];

const projectStatusFilters = [
  "all",
  ...projectStatuses,
] as const satisfies readonly ProjectStatusFilter[];

const projectsSortableFields = ["name", "status", "createdAt"] as const;

type ProjectSortableField = (typeof projectsSortableFields)[number];

/**
 * Values are translation KEYS (resolved against the `projects.statuses`
 * message namespace via `useTranslations`), not literal labels.
 */
const projectStatusLabels: Record<ProjectStatusFilter, string> = {
  all: "all",
  [ProjectStatus.DRAFT]: "DRAFT",
  [ProjectStatus.ACTIVE]: "ACTIVE",
  [ProjectStatus.ARCHIVED]: "ARCHIVED",
};

const projectsSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  status: createEnumParser(projectStatusFilters).withDefault("all"),
  sortBy: createSortByParser(projectsSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

function isProjectStatusFilter(value: string): value is ProjectStatusFilter {
  return (projectStatusFilters as readonly string[]).includes(value);
}

export {
  isProjectStatusFilter,
  projectStatuses,
  projectStatusFilters,
  projectStatusLabels,
  projectsSearchParams,
  projectsSortableFields,
};

export type { ProjectSortableField, ProjectStatusFilter };
