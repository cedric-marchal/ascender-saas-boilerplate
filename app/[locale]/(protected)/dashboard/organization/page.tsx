import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLoader, type SearchParams } from "nuqs/server";

import { membersSearchParams } from "@/features/organizations/constants/members-filters.constant";
import { MembersPage } from "@/features/organizations/pages/members-page";
import { getSeatCapStatus } from "@/features/organizations/services/check-seat-capacity.service";
import { getOrganizationMembers } from "@/features/organizations/services/get-organization-members.service";
import { getOrganization } from "@/features/organizations/services/get-organization.service";

import { filterRatelimit } from "@/lib/ratelimit";
import { requireSession } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

const loadSearchParams = createLoader(membersSearchParams);

type OrganizationRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params,
}: OrganizationRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "organizations",
  });

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrganizationRoute({
  params,
  searchParams,
}: OrganizationRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireSession();

  if (!session.activeOrganizationId) {
    const t = await getTranslations({
      locale: locale as Locale,
      namespace: "organizations",
    });

    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("noActiveOrganization")}</p>
      </div>
    );
  }

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const filters = await loadSearchParams(searchParams);

  const [
    organization,
    { members, totalCount, totalPages, currentPage },
    seatCapStatus,
  ] = await Promise.all([
    getOrganization({
      userId: session.user.id,
      organizationId: session.activeOrganizationId,
    }),
    getOrganizationMembers({
      organizationId: session.activeOrganizationId,
      userId: session.user.id,
      ...filters,
    }),
    getSeatCapStatus(session.activeOrganizationId),
  ]);

  return (
    <MembersPage
      members={members}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      currentUserId={session.user.id}
      memberRole={organization.role}
      organizationName={organization.name}
      organizationMemberCount={organization.memberCount}
      seatCap={seatCapStatus.seatCap}
      isOverSeatCap={seatCapStatus.isOverCap}
    />
  );
}
