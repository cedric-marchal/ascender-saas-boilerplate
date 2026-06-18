"use client";

import { useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2 } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  organizationsSearchParams,
  type OrganizationSortableField,
} from "@/features/admin/constants/organizations-filters.constant";
import type { OrganizationRow } from "@/features/admin/services/get-organizations.service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { truncate } from "@/utils/string/truncate";

function SortableHeader({
  field,
  label,
}: {
  field: OrganizationSortableField;
  label: string;
}) {
  const [isLoading, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(organizationsSearchParams, {
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

const organizationsColumns: ColumnDef<OrganizationRow>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" label="Nom" />,
    cell: ({ row }) => {
      const organization = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
            <Building2 className="text-primary size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{organization.name}</p>
            <p className="text-muted-foreground text-xs">{organization.slug}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "ownerEmail",
    header: "Propriétaire",
    cell: ({ row }) => {
      const email = row.original.ownerEmail;

      if (!email) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }

      return truncate(email, 40);
    },
  },
  {
    accessorKey: "memberCount",
    header: "Membres",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.memberCount}</span>
    ),
  },
  {
    accessorKey: "plan",
    header: () => <SortableHeader field="plan" label="Plan" />,
    cell: ({ row }) => {
      const plan = row.original.plan;

      return (
        <Badge variant={plan === "free" ? "secondary" : "default"}>
          {plan}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => <SortableHeader field="createdAt" label="Date de création" />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);

      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(date);
    },
  },
];

export { organizationsColumns };
