"use client";

import { useTransition } from "react";

import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2 } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";
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
  labelKey,
}: {
  field: OrganizationSortableField;
  labelKey: "nameHeader" | "planHeader" | "createdAtHeader";
}) {
  const t = useTranslations("admin.organizations.columns");
  const label = t(labelKey);
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

function OwnerHeader() {
  const t = useTranslations("admin.organizations.columns");

  return t("ownerHeader");
}

function OwnerCell({ email }: { email: string | null }) {
  const t = useTranslations("admin.organizations");

  if (!email) {
    return (
      <span className="text-muted-foreground text-sm">{t("noOwner")}</span>
    );
  }

  return truncate(email, 40);
}

function MembersHeader() {
  const t = useTranslations("admin.organizations.columns");

  return t("membersHeader");
}

function CreatedAtCell({ createdAt }: { createdAt: Date }) {
  const locale = useLocale();
  const bcp47 = LOCALE_METADATA[locale as Locale].bcp47;

  return new Intl.DateTimeFormat(bcp47, {
    dateStyle: "medium",
  }).format(new Date(createdAt));
}

const organizationsColumns: ColumnDef<OrganizationRow>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" labelKey="nameHeader" />,
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
    header: () => <OwnerHeader />,
    cell: ({ row }) => <OwnerCell email={row.original.ownerEmail} />,
  },
  {
    accessorKey: "memberCount",
    header: () => <MembersHeader />,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.memberCount}</span>
    ),
  },
  {
    accessorKey: "plan",
    header: () => <SortableHeader field="plan" labelKey="planHeader" />,
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
    header: () => (
      <SortableHeader field="createdAt" labelKey="createdAtHeader" />
    ),
    cell: ({ row }) => <CreatedAtCell createdAt={row.original.createdAt} />,
  },
];

export { organizationsColumns };
