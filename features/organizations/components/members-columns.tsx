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
import { useQueryStates } from "nuqs";
import { toast } from "sonner";

import { removeMemberAction } from "@/features/organizations/actions/remove-member.action";
import { transferOwnershipAction } from "@/features/organizations/actions/transfer-ownership.action";
import { RoleForm } from "@/features/organizations/components/forms/role-form";
import {
  membersSearchParams,
  type MemberSortableField,
} from "@/features/organizations/constants/members-filters.constant";
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

const roleDisplayLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

type MembersTableContext = {
  currentUserId: string;
  memberRole: string;
};

function SortableHeader({
  field,
  label,
}: {
  field: MemberSortableField;
  label: string;
}) {
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

      toast.success("Membre retiré avec succès");
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

      toast.success("Propriété transférée avec succès");
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
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Actions pour {member.user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isTargetOwner && (
            <DropdownMenuItem onSelect={() => setIsRoleDialogOpen(true)}>
              <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
              Modifier le rôle
            </DropdownMenuItem>
          )}
          {memberRole === "owner" && !isTargetOwner && (
            <DropdownMenuItem onSelect={() => setIsTransferDialogOpen(true)}>
              <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
              Transférer la propriété
            </DropdownMenuItem>
          )}
          {!isTargetOwner && <DropdownMenuSeparator />}
          {!isTargetOwner && (
            <DropdownMenuItem
              onSelect={() => setIsRemoveDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Retirer du projet
            </DropdownMenuItem>
          )}
          {isTargetOwner && memberRole !== "owner" && (
            <DropdownMenuItem disabled>
              <ShieldOff className="mr-2 h-4 w-4" aria-hidden="true" />
              Propriétaire (non modifiable)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Modifier le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Modifier le rôle de {member.user.name} dans l'organisation.
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
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${member.user.name} n'aura plus accès à l'organisation. Cette action est réversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isExecuting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isExecuting}
            >
              {isExecuting ? "Suppression..." : "Retirer"}
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
            <AlertDialogTitle>Transférer la propriété ?</AlertDialogTitle>
            <AlertDialogDescription>
              {`${member.user.name} deviendra propriétaire et vous serez rétrogradé au rôle d'administrateur. Cette action est irréversible sans le consentement du nouveau propriétaire.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferDialogOpen(false)}
              disabled={isExecuting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleTransferOwnership}
              disabled={isExecuting}
            >
              {isExecuting ? "Transfert en cours..." : "Transférer"}
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
      header: () => <SortableHeader field="name" label="Nom" />,
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
      header: () => <SortableHeader field="email" label="Email" />,
      cell: ({ row }) => truncate(row.original.user.email, 40),
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={roleBadgeVariant[role] ?? "outline"}>
            {roleDisplayLabels[role] ?? role}
          </Badge>
        );
      },
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
