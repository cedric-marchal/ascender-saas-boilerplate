import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AuditLogPage } from "@/features/organizations/pages/audit-log-page";
import { getAuditLog } from "@/features/organizations/services/get-audit-log.service";

import { filterRatelimit } from "@/lib/ratelimit";
import { requireSession } from "@/lib/session";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

export const metadata: Metadata = {
  title: "Journal d'activité",
  robots: {
    index: false,
    follow: false,
  },
};

type OrganizationAuditRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function OrganizationAuditRoute({
  params,
  searchParams,
}: OrganizationAuditRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireSession();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">
          Aucune organisation active. Veuillez sélectionner une organisation.
        </p>
      </div>
    );
  }

  const { success } = await filterRatelimit.limit(session.user.id);

  if (!success) {
    return <TooManyRequestsPage />;
  }

  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10));

  const { entries, totalCount, totalPages, currentPage } = await getAuditLog({
    organizationId: session.activeOrganizationId,
    userId: session.user.id,
    page,
  });

  return (
    <AuditLogPage
      entries={entries}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
