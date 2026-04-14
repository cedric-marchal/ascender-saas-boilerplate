import type { Metadata } from "next";

import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";
import { getAdminDashboard } from "@/features/admin/services/get-admin-dashboard.service";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administration",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRoute() {
  await requireAdmin();

  const metrics = await getAdminDashboard();

  return <AdminDashboardPage metrics={metrics} />;
}
