import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpPage } from "@/features/auth/pages/sign-up-page";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

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
  alternates: { canonical: "/inscription" },
  openGraph: {
    title: `Inscription | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/inscription",
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

export default async function InscriptionRoute() {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

  return <SignUpPage />;
}
