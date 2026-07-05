import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardHomePage } from "@/features/dashboard/pages/dashboard-home-page";

import { requireCustomer } from "@/lib/session";

type DashboardRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DashboardRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "dashboard.home",
  });

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DashboardRoute({ params }: DashboardRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireCustomer();

  return <DashboardHomePage userName={session.user.name} />;
}
