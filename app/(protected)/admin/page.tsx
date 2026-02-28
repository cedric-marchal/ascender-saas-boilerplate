import type { Metadata } from "next";

import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";

import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminRoute() {
  await requireAdmin();

  return <AdminDashboardPage />;
}
