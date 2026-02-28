import type { Metadata } from "next";

import { type SearchParams, createLoader } from "nuqs/server";

import { UsersPage } from "@/features/users/pages/users-page";
import { usersSearchParams } from "@/features/users/constants/users-filters.constant";
import { getUsers } from "@/features/users/services/get-users.service";

import { requireAdminVerifiedEmail } from "@/lib/session";

const loadSearchParams = createLoader(usersSearchParams);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUsersRouteProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminUsersRoute({ searchParams }: AdminUsersRouteProps) {
  await requireAdminVerifiedEmail();

  const filters = await loadSearchParams(searchParams);
  const { users, totalCount, totalPages, currentPage } = await getUsers(filters);

  return (
    <UsersPage
      users={users}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
