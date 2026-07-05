import type { Metadata } from "next";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

import { env } from "@/lib/env";
import { requireGuest } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Créez un nouveau mot de passe pour votre compte ${APP_NAME}.`;

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: DESCRIPTION,
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

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
