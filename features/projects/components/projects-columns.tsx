"use client";

import { useState, useTransition } from "react";

import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";
import { useQueryStates } from "nuqs";

import { DeleteProjectModal } from "@/features/projects/components/modals/delete-project-modal";
import { EditProjectModal } from "@/features/projects/components/modals/edit-project-modal";
import {
  projectsSearchParams,
  projectStatusLabels,
  type ProjectSortableField,
} from "@/features/projects/constants/project-filters.constant";
import type { ProjectItem } from "@/features/projects/services/get-projects.service";

import { ProjectStatus } from "@/lib/generated/prisma/browser";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { truncate, truncateName } from "@/utils/string/truncate";

const statusBadgeVariant: Record<
  ProjectStatus,
  "default" | "secondary" | "outline"
> = {
  [ProjectStatus.DRAFT]: "outline",
  [ProjectStatus.ACTIVE]: "default",
  [ProjectStatus.ARCHIVED]: "secondary",
};

function SortableHeader({
  field,
  labelKey,
}: {
  field: ProjectSortableField;
  labelKey: "nameHeader" | "statusHeader" | "createdAtHeader";
}) {
  const t = useTranslations("projects.columns");
  const label = t(labelKey);
  const [isLoading, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(projectsSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });

  const isActive = filters.sortBy === field;

  function handleSort() {
    if (isActive && filters.order === "desc") {
      setFilters({
        sortBy: null,
        order: null,
        page: 1,
      });
      return;
    }

    setFilters({
      sortBy: field,
      order: isActive && filters.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  }

  const SortIcon = isActive
    ? filters.order === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSort}
      disabled={isLoading}
    >
      {label}
      <SortIcon className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

type ProjectActionsProps = {
  project: ProjectItem;
};

function ProjectActions({ project }: ProjectActionsProps) {
  const t = useTranslations("projects.columns");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">
              {t("actionsFor", { name: project.name })}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectModal
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <DeleteProjectModal
        project={project}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}

function DescriptionHeader() {
  const t = useTranslations("projects.columns");

  return t("descriptionHeader");
}

function DescriptionCell({ description }: { description: string | null }) {
  const t = useTranslations("projects.columns");

  return description ? truncate(description, 60) : t("noDescription");
}

function StatusBadgeCell({ status }: { status: ProjectStatus }) {
  const t = useTranslations("projects.statuses");

  return (
    <Badge variant={statusBadgeVariant[status]}>
      {t(projectStatusLabels[status])}
    </Badge>
  );
}

function CreatedAtCell({ createdAt }: { createdAt: Date }) {
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;

  return new Intl.DateTimeFormat(bcp47, {
    dateStyle: "medium",
  }).format(new Date(createdAt));
}

const projectsColumns: ColumnDef<ProjectItem>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" labelKey="nameHeader" />,
    cell: ({ row }) => (
      <span className="font-medium">{truncateName(row.original.name)}</span>
    ),
  },
  {
    accessorKey: "description",
    header: () => <DescriptionHeader />,
    cell: ({ row }) => (
      <DescriptionCell description={row.original.description} />
    ),
  },
  {
    accessorKey: "status",
    header: () => <SortableHeader field="status" labelKey="statusHeader" />,
    cell: ({ row }) => <StatusBadgeCell status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <SortableHeader field="createdAt" labelKey="createdAtHeader" />
    ),
    cell: ({ row }) => <CreatedAtCell createdAt={row.original.createdAt} />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ProjectActions project={row.original} />,
  },
];

export { projectsColumns };
