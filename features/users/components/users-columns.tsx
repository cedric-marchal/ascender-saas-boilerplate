"use client";

import { useTransition } from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  roleLabels,
  usersSearchParams,
  type UserSortableField,
} from "@/features/users/constants/users-filters.constant";

import { UserRole, type User } from "@/lib/generated/prisma/browser";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getAvatarUrl } from "@/utils/string/get-avatar-url";
import { getInitials } from "@/utils/string/get-initials";

type UserTableData = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "role"
  | "emailVerified"
  | "image"
  | "slug"
  | "createdAt"
>;

function SortableHeader({
  field,
  label,
}: {
  field: UserSortableField;
  label: string;
}) {
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
        <Link
          href={`/admin/utilisateurs/${user.slug}`}
          className="flex items-center gap-3 hover:underline"
        >
          <Avatar className="h-8 w-8">
            {user.image ? (
              <AvatarImage
                src={getAvatarUrl(user.image)}
                alt={`${user.name} avatar`}
              />
            ) : (
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </Link>
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
        <Badge variant={role === UserRole.ADMIN ? "default" : "secondary"}>
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
export type { UserTableData };
