import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";

import { env } from "@/lib/env";
import { requireGuest } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Réinitialisez votre mot de passe ${APP_NAME}. Recevez un lien de réinitialisation par email.`;

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: DESCRIPTION,
  alternates: {
    canonical: "/forgot-password",
  },
  openGraph: {
    title: `Mot de passe oublié | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/forgot-password",
  },
  twitter: {
    title: `Mot de passe oublié | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: false,
    follow: true,
  },
};

type ForgotPasswordRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordRoute({
  params,
}: ForgotPasswordRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireGuest();

  return <ForgotPasswordPage />;
}
