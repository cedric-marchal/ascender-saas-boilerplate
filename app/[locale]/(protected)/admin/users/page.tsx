import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { createLoader, type SearchParams } from "nuqs/server";

import { usersSearchParams } from "@/features/users/constants/users-filters.constant";
import { UsersPage } from "@/features/users/pages/users-page";
import { getUsers } from "@/features/users/services/get-users.service";

import { filterRatelimit } from "@/lib/ratelimit";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

const loadSearchParams = createLoader(usersSearchParams);

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUsersRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function AdminUsersRoute({
  params,
  searchParams,
}: AdminUsersRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireAdminVerifiedEmail();

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const filters = await loadSearchParams(searchParams);

  const { users, totalCount, totalPages, currentPage } =
    await getUsers(filters);

  return (
    <UsersPage
      users={users}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
