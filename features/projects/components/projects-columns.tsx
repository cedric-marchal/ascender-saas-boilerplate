"use client";

import { useState, useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
  label,
}: {
  field: ProjectSortableField;
  label: string;
}) {
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Actions pour {project.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Supprimer
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

const projectsColumns: ColumnDef<ProjectItem>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" label="Nom" />,
    cell: ({ row }) => (
      <span className="font-medium">{truncateName(row.original.name)}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) =>
      row.original.description ? truncate(row.original.description, 60) : "—",
  },
  {
    accessorKey: "status",
    header: () => <SortableHeader field="status" label="Statut" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusBadgeVariant[status]}>
          {projectStatusLabels[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => <SortableHeader field="createdAt" label="Créé le" />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(date);
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ProjectActions project={row.original} />,
  },
];

export { projectsColumns };
