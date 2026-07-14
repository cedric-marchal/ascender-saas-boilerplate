import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLoader, type SearchParams } from "nuqs/server";

import { organizationsSearchParams } from "@/features/admin/constants/organizations-filters.constant";
import { OrganizationsPage } from "@/features/admin/pages/organizations-page";
import { getOrganizations } from "@/features/admin/services/get-organizations.service";

import { filterRatelimit } from "@/lib/ratelimit";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

const loadSearchParams = createLoader(organizationsSearchParams);

type AdminOrganizationsRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params,
}: AdminOrganizationsRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "admin.organizations",
  });

  return {
    title: t("pageTitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminOrganizationsRoute({
  params,
  searchParams,
}: AdminOrganizationsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireAdminVerifiedEmail();

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const filters = await loadSearchParams(searchParams);

  const { organizations, totalCount, totalPages, currentPage } =
    await getOrganizations(filters);

  return (
    <OrganizationsPage
      organizations={organizations}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
