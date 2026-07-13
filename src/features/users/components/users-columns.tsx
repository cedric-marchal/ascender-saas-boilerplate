"use client";

import { useTransition } from "react";

import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { Link } from "@/i18n/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";
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
import { truncate, truncateName } from "@/utils/string/truncate";

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
  labelKey,
}: {
  field: UserSortableField;
  labelKey: "nameHeader" | "emailHeader" | "createdAtHeader";
}) {
  const t = useTranslations("admin.users.columns");
  const label = t(labelKey);
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

function RoleHeader() {
  const t = useTranslations("admin.users.columns");

  return t("roleHeader");
}

function RoleBadgeCell({ role }: { role: UserRole }) {
  const t = useTranslations("admin.users.roles");

  return (
    <Badge variant={role === UserRole.ADMIN ? "default" : "secondary"}>
      {t(roleLabels[role])}
    </Badge>
  );
}

function VerifiedHeader() {
  const t = useTranslations("admin.users.columns");

  return t("verifiedHeader");
}

function VerifiedBadgeCell({ verified }: { verified: boolean }) {
  const t = useTranslations("admin.users.columns");

  return (
    <Badge variant={verified ? "default" : "outline"}>
      {verified ? t("verified") : t("unverified")}
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

const usersColumns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" labelKey="nameHeader" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Link
          href={{
            pathname: "/admin/users/[slug]",
            params: { slug: user.slug },
          }}
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
          <span className="font-medium">{truncateName(user.name)}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: "email",
    header: () => <SortableHeader field="email" labelKey="emailHeader" />,
    cell: ({ row }) => truncate(row.original.email, 40),
  },
  {
    accessorKey: "role",
    header: () => <RoleHeader />,
    cell: ({ row }) => <RoleBadgeCell role={row.original.role} />,
  },
  {
    accessorKey: "emailVerified",
    header: () => <VerifiedHeader />,
    cell: ({ row }) => (
      <VerifiedBadgeCell verified={row.original.emailVerified} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <SortableHeader field="createdAt" labelKey="createdAtHeader" />
    ),
    cell: ({ row }) => <CreatedAtCell createdAt={row.original.createdAt} />,
  },
];

export { usersColumns };
export type { UserTableData };
