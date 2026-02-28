import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Réinitialisez votre mot de passe ${APP_NAME}. Recevez un lien de réinitialisation par email.`;

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: DESCRIPTION,
  alternates: { canonical: "/mot-de-passe-oublie" },
  openGraph: {
    title: `Mot de passe oublié | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/mot-de-passe-oublie",
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

export default async function MotDePasseOublieRoute() {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

  return <ForgotPasswordPage />;
}
