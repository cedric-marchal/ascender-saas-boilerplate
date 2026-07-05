import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";
import { getCachedAdminDashboard } from "@/features/admin/services/get-admin-dashboard.service";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administration",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminRoute({ params }: AdminRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireAdmin();

  const metrics = await getCachedAdminDashboard();

  return <AdminDashboardPage metrics={metrics} />;
}
