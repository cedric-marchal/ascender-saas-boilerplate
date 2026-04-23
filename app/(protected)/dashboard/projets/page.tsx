import type { Metadata } from "next";

import { ProjectsPage } from "@/features/projects/pages/projects-page";

import { requireCustomerPlan } from "@/lib/session";

export const metadata: Metadata = {
  title: "Projets",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardProjectsRoute() {
  await requireCustomerPlan("pro");

  return <ProjectsPage />;
}
