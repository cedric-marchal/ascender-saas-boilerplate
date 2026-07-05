import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SettingsPage } from "@/features/account/pages/settings-page";

import { requireCustomer } from "@/lib/session";

type DashboardSettingsRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DashboardSettingsRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "account.settings",
  });

  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

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
