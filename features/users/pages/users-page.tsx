import {
  type UserTableData,
  usersColumns,
} from "@/features/users/components/users-columns";
import { UsersFilters } from "@/features/users/components/users-filters";

import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";
import { Main } from "@/components/main";

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
  return (
    <Main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted-foreground">
          {totalCount} utilisateur{totalCount > 1 ? "s" : ""} trouvé
          {totalCount > 1 ? "s" : ""}
        </p>
      </header>

      <UsersFilters />

      <section className="space-y-4">
        <DataTable columns={usersColumns} data={users as UserTableData[]} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { UsersPage };
