import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Créez un nouveau mot de passe pour votre compte ${APP_NAME}.`;

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  description: DESCRIPTION,
  alternates: {
    canonical: "/nouveau-mot-de-passe",
  },
  robots: {
    index: false,
    follow: false,
  },
};

type ResetPasswordRouteProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordRoute({
  searchParams,
}: ResetPasswordRouteProps) {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

  const { token } = await searchParams;

  if (!token) {
    redirect("/mot-de-passe-oublie");
  }

  return <ResetPasswordPage token={token} />;
}
