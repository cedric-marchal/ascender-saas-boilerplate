import type { Metadata } from "next";

import { requireCustomerPlan } from "@/features/billing/guards/require-customer-plan";
import { ProjectsPage } from "@/features/projects/pages/projects-page";

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
