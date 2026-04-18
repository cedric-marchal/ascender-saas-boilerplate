import type { Metadata } from "next";

import { DashboardHomePage } from "@/features/dashboard/pages/dashboard-home-page";

import { requireCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardRoute() {
  const session = await requireCustomer();

  return <DashboardHomePage userName={session.user.name} />;
}
