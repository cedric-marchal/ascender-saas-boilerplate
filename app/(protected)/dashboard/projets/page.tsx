import type { Metadata } from "next";

import { createLoader, type SearchParams } from "nuqs/server";

import { requireCustomerPlan } from "@/features/billing/guards/require-customer-plan";
import { projectsSearchParams } from "@/features/projects/constants/project-filters.constant";
import { ProjectsPage } from "@/features/projects/pages/projects-page";
import { getProjects } from "@/features/projects/services/get-projects.service";

import { filterRatelimit } from "@/lib/ratelimit";

import { TooManyRequestsPage } from "@/components/pages/too-many-requests-page";

const loadSearchParams = createLoader(projectsSearchParams);

export const metadata: Metadata = {
  title: "Projets",
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardProjectsRouteProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardProjectsRoute({
  searchParams,
}: DashboardProjectsRouteProps) {
  const session = await requireCustomerPlan("pro");

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
