import type { Metadata } from "next";

import { type SearchParams, createLoader } from "nuqs/server";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";

import {
  type UserTableData,
  usersColumns,
} from "@/app/(protected)/admin/utilisateurs/_components/users-columns";
import { UsersFilters } from "@/app/(protected)/admin/utilisateurs/_components/users-filters";
import { getUsers } from "@/app/(protected)/admin/utilisateurs/_lib/get-users";

const loadSearchParams = createLoader(usersSearchParams);

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUsersPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await requireAdminVerifiedEmail();

  const filters = await loadSearchParams(searchParams);

  const { users, totalCount, totalPages, currentPage } =
    await getUsers(filters);

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
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
    </main>
  );
}
