import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLoader, type SearchParams } from "nuqs/server";

import { requireCustomerPlan } from "@/features/billing/guards/require-customer-plan";
import { projectsSearchParams } from "@/features/projects/constants/project-filters.constant";
import { ProjectsPage } from "@/features/projects/pages/projects-page";
import { getProjects } from "@/features/projects/services/get-projects.service";

import { filterRatelimit } from "@/lib/ratelimit";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

const loadSearchParams = createLoader(projectsSearchParams);

type DashboardProjectsRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params,
}: DashboardProjectsRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "projects",
  });

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DashboardProjectsRoute({
  params,
  searchParams,
}: DashboardProjectsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireCustomerPlan("pro");

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

  const { projects, totalCount, totalPages, currentPage } = await getProjects({
    organizationId: session.activeOrganizationId,
    userId: session.user.id,
    ...filters,
  });

  const hasActiveFilters = Boolean(filters.search || filters.status !== "all");

  return (
    <ProjectsPage
      projects={projects}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      hasActiveFilters={hasActiveFilters}
    />
  );
}
