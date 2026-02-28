import type { Metadata } from "next";

import { ProjectsPage } from "@/features/projects/pages/projects-page";

import { requireCustomerProSubscription } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projets",
  robots: { index: false, follow: false },
};

export default async function DashboardProjectsRoute() {
  await requireCustomerProSubscription();

  return <ProjectsPage />;
}
