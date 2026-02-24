"use client";

import { useTransition } from "react";

import {
  roleLabels,
  usersSearchParams,
} from "@/features/users/constants/users-filters.constant";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import type { UserRole } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";
import type { User } from "@/lib/generated/prisma/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getInitials } from "@/utils/string/get-initials";

export type UserTableData = Pick<
  User,
  "id" | "name" | "email" | "role" | "emailVerified" | "image" | "createdAt"
>;

function SortableHeader({ field, label }: { field: string; label: string }) {
  const [isLoading, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(usersSearchParams, {
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

const usersColumns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" label="Nom" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {user.image ? (
              <AvatarImage
                src={`${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${user.image}`}
                alt={`${user.name} avatar`}
              />
            ) : (
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: () => <SortableHeader field="email" label="Email" />,
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {roleLabels[role]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: "Email vérifié",
    cell: ({ row }) => {
      const verified = row.original.emailVerified;
      return (
        <Badge variant={verified ? "default" : "outline"}>
          {verified ? "Vérifié" : "Non vérifié"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <SortableHeader field="createdAt" label="Date d'inscription" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(date);
    },
  },
];

export { usersColumns };
