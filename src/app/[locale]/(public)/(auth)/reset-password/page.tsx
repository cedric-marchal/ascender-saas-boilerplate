import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

import { requireGuest } from "@/lib/session";

type ResetPasswordRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: ResetPasswordRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "auth.resetPassword",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const description = t("seoDescription", { appName: tCommon("appName") });
  const alternates = getLocaleAlternates("/reset-password", locale as Locale);

  return {
    title: t("title"),
    description,
    alternates,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ResetPasswordRoute({
  params,
  searchParams,
}: ResetPasswordRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireGuest();

  const { token } = await searchParams;

  if (!token) {
    return redirect({ href: "/forgot-password", locale: locale as Locale });
  }

  return <ResetPasswordPage token={token} />;
}
