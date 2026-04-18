import type { Metadata } from "next";

import { SignInPage } from "@/features/auth/pages/sign-in-page";

import { env } from "@/lib/env";
import { requireGuest } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Connectez-vous à votre compte ${APP_NAME}. Accédez à votre tableau de bord et gérez vos projets.`;

export const metadata: Metadata = {
  title: "Connexion",
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "connexion", "login", "sign in"],
  alternates: {
    canonical: "/connexion",
  },
  openGraph: {
    title: `Connexion | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/connexion",
  },
  twitter: {
    title: `Connexion | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function SignInRoute() {
  await requireGuest();

  return <SignInPage />;
}
