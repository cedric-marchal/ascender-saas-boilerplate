import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { MembersFilters } from "@/features/organizations/components/members-filters";
import { MembersTable } from "@/features/organizations/components/members-table";
import { InviteModal } from "@/features/organizations/components/modals/invite-modal";
import type { MemberItem } from "@/features/organizations/services/get-organization-members.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { Separator } from "@/components/ui/separator";

type MembersPageProps = {
  members: MemberItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentUserId: string;
  memberRole: string;
  organizationName: string;
};

function MembersPage({
  members,
  totalCount,
  totalPages,
  currentPage,
  currentUserId,
  memberRole,
  organizationName,
}: MembersPageProps) {
  const t = useTranslations("organizations.membersPage");
  const canManage = memberRole === "owner" || memberRole === "admin";

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <Users className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {organizationName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("memberCount", { count: totalCount })}
            </p>
          </div>
        </div>

        {canManage && <InviteModal />}
      </header>

      <Separator />

      <MembersFilters />

      <section className="space-y-4">
        <MembersTable
          members={members}
          currentUserId={currentUserId}
          memberRole={memberRole}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { MembersPage };
