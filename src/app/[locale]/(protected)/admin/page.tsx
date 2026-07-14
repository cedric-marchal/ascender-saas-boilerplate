import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";
import { getCachedAdminDashboard } from "@/features/admin/services/get-admin-dashboard.service";

import { requireAdmin } from "@/lib/session";

type AdminRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AdminRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "admin.dashboard",
  });

  return {
    title: t("pageTitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminRoute({ params }: AdminRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireAdmin();

  const metrics = await getCachedAdminDashboard();

  return <AdminDashboardPage metrics={metrics} />;
}
