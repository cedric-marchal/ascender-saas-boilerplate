import type { Metadata } from "next";

import {
  type SearchParams,
  createLoader,
  createParser,
  parseAsStringLiteral,
} from "nuqs/server";

import { prisma } from "@/lib/prisma";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { DataTable } from "@/components/ui/data-table";

import {
  type UserTableData,
  usersColumns,
} from "@/app/(protected)/admin/utilisateurs/_components/users-columns";
import { UsersFilters } from "@/app/(protected)/admin/utilisateurs/_components/users-filters";
import { UsersPagination } from "@/app/(protected)/admin/utilisateurs/_components/users-pagination";

const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;
const PAGE_SIZE = 10;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return "";
    }
    return query.trim();
  },
  serialize(value) {
    return value;
  },
});

const userRoles = ["all", "ADMIN", "CUSTOMER"] as const;
const userVerificationStatus = ["all", "verified", "unverified"] as const;

export const usersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: parseAsStringLiteral(userRoles).withDefault("all"),
  verified: parseAsStringLiteral(userVerificationStatus).withDefault("all"),
  page: parseAsPage.withDefault(1),
};

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

  const { search, role, verified, page } = await loadSearchParams(searchParams);

  const safeSearch = search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(page, MAX_PAGE));
  const safeRole = userRoles.includes(role) ? role : "all";
  const safeVerified = userVerificationStatus.includes(verified)
    ? verified
    : "all";

  const whereClause = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(safeRole !== "all" && { role: safeRole }),
    ...(safeVerified === "verified" && { emailVerified: true }),
    ...(safeVerified === "unverified" && { emailVerified: false }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
        <UsersPagination currentPage={safePage} totalPages={totalPages} />
      </section>
    </main>
  );
}
