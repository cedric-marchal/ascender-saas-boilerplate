import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { SettingsPage } from "@/features/account/pages/settings-page";

import { requireCustomer } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardSettingsRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardSettingsRoute({
  params,
}: DashboardSettingsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireCustomer();

  return (
    <SettingsPage
      user={{
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
      }}
      showStripeWarning={true}
    />
  );
}
