"use client";

import { useMemo } from "react";

import { createMembersColumns } from "@/features/organizations/components/members-columns";
import type { MemberItem } from "@/features/organizations/services/get-organization-members.service";

import { DataTable } from "@/components/ui/data-table";

type MembersTableProps = {
  members: MemberItem[];
  currentUserId: string;
  memberRole: string;
};

function MembersTable({
  members,
  currentUserId,
  memberRole,
}: MembersTableProps) {
  const columns = useMemo(
    () => createMembersColumns({ currentUserId, memberRole }),
    [currentUserId, memberRole],
  );

  return <DataTable columns={columns} data={members} />;
}

export { MembersTable };
