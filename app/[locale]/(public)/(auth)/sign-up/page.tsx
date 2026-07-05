import type { Metadata } from "next";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { SignUpPage } from "@/features/auth/pages/sign-up-page";

import { env } from "@/lib/env";
import { requireGuest } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Créez votre compte ${APP_NAME} gratuitement. Accédez à toutes les fonctionnalités en quelques secondes.`;

export const metadata: Metadata = {
  title: "Inscription",
  description: DESCRIPTION,
  keywords: [
    APP_NAME.toLowerCase(),
    "inscription",
    "sign up",
    "créer un compte",
  ],
  alternates: {
    canonical: "/sign-up",
  },
  openGraph: {
    title: `Inscription | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/sign-up",
  },
  twitter: {
    title: `Inscription | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type SignUpRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function SignUpRoute({ params }: SignUpRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  await requireGuest();

  return <SignUpPage />;
}
