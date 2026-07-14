import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  usersColumns,
  type UserTableData,
} from "@/features/users/components/users-columns";
import { UsersFilters } from "@/features/users/components/users-filters";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

type UsersPageProps = {
  users: UserTableData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

function UsersPage({
  users,
  totalCount,
  totalPages,
  currentPage,
}: UsersPageProps) {
  const t = useTranslations("admin.users");

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <Users className="text-primary size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("count", { count: totalCount })}
            </p>
          </div>
        </div>
      </header>

      <Separator />

      <UsersFilters />

      <section className="space-y-4">
        <DataTable columns={usersColumns} data={users as UserTableData[]} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { UsersPage };
