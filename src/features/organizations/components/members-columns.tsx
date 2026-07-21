"use client";

import { useState, useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Crown,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";

import { removeMemberAction } from "@/features/organizations/actions/remove-member.action";
import { transferOwnershipAction } from "@/features/organizations/actions/transfer-ownership.action";
import { RoleForm } from "@/features/organizations/components/forms/role-form";
import {
  membersSearchParams,
  type MemberSortableField,
} from "@/features/organizations/constants/members-filters.constant";
import { ORGANIZATION_ROLE_LABELS } from "@/features/organizations/constants/organization-roles.constant";
import type { MemberItem } from "@/features/organizations/services/get-organization-members.service";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";
import { getInitials } from "@/utils/string/get-initials";
import { truncate, truncateName } from "@/utils/string/truncate";

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

type MembersTableContext = {
  currentUserId: string;
  memberRole: string;
};

function SortableHeader({
  field,
  labelKey,
}: {
  field: MemberSortableField;
  labelKey: "nameHeader" | "emailHeader";
}) {
  const t = useTranslations("organizations.membersColumns");
  const label = t(labelKey);
  const [isLoading, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(membersSearchParams, {
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
  const t = useTranslations("organizations.membersColumns");

  return t("roleHeader");
}

function RoleBadgeCell({ role }: { role: string }) {
  const t = useTranslations("organizations.roles");
  const labelKey = ORGANIZATION_ROLE_LABELS[role];

  return (
    <Badge variant={roleBadgeVariant[role] ?? "outline"}>
      {labelKey ? t(labelKey) : role}
    </Badge>
  );
}

type MemberActionsProps = {
  member: MemberItem;
  currentUserId: string;
  memberRole: string;
};

function MemberActions({
  member,
  currentUserId,
  memberRole,
}: MemberActionsProps) {
  const t = useTranslations("organizations.membersColumns");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const canManage = memberRole === "owner" || memberRole === "admin";
  const isSelf = member.userId === currentUserId;
  const isTargetOwner = member.role === "owner";

  if (!canManage || isSelf) {
    return null;
  }

  async function handleRemove() {
    setIsExecuting(true);

    try {
      getActionResult(await removeMemberAction({ memberId: member.id }));

      toast.success(t("removeDialog.successToast"));
      setIsRemoveDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleTransferOwnership() {
    setIsExecuting(true);

    try {
      getActionResult(await transferOwnershipAction({ memberId: member.id }));

      toast.success(t("transferDialog.successToast"));
      setIsTransferDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="icon" />}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">
            {t("actionsFor", { name: member.user.name })}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isTargetOwner && (
            <DropdownMenuItem onSelect={() => setIsRoleDialogOpen(true)}>
              <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("changeRole")}
            </DropdownMenuItem>
          )}
          {memberRole === "owner" && !isTargetOwner && (
            <DropdownMenuItem onSelect={() => setIsTransferDialogOpen(true)}>
              <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("transferOwnership")}
            </DropdownMenuItem>
          )}
          {!isTargetOwner && <DropdownMenuSeparator />}
          {!isTargetOwner && (
            <DropdownMenuItem
              onSelect={() => setIsRemoveDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("removeMember")}
            </DropdownMenuItem>
          )}
          {isTargetOwner && memberRole !== "owner" && (
            <DropdownMenuItem disabled>
              <ShieldOff className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("ownerNotEditable")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("changeRoleDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("changeRoleDialog.description", { name: member.user.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RoleForm
            memberId={member.id}
            currentRole={member.role}
            onSuccess={() => setIsRoleDialogOpen(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDialog.description", { name: member.user.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isExecuting}
            >
              {t("removeDialog.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isExecuting}
            >
              {isExecuting
                ? t("removeDialog.confirming")
                : t("removeDialog.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transferDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("transferDialog.description", { name: member.user.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferDialogOpen(false)}
              disabled={isExecuting}
            >
              {t("transferDialog.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleTransferOwnership}
              disabled={isExecuting}
            >
              {isExecuting
                ? t("transferDialog.confirming")
                : t("transferDialog.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function createMembersColumns(
  context: MembersTableContext,
): ColumnDef<MemberItem>[] {
  return [
    {
      accessorKey: "user.name",
      header: () => <SortableHeader field="name" labelKey="nameHeader" />,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {truncateName(member.user.name)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: () => <SortableHeader field="email" labelKey="emailHeader" />,
      cell: ({ row }) => truncate(row.original.user.email, 40),
    },
    {
      accessorKey: "role",
      header: () => <RoleHeader />,
      cell: ({ row }) => <RoleBadgeCell role={row.original.role} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <MemberActions
          member={row.original}
          currentUserId={context.currentUserId}
          memberRole={context.memberRole}
        />
      ),
    },
  ];
}

export { createMembersColumns };
export type { MembersTableContext };
