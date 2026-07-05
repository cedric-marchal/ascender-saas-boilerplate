import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { DashboardHomePage } from "@/features/dashboard/pages/dashboard-home-page";

import { requireCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireCustomer();

  return <DashboardHomePage userName={session.user.name} />;
}
