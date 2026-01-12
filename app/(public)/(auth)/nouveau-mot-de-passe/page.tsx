import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";

import { ResetPasswordForm } from "@/app/(public)/(auth)/nouveau-mot-de-passe/_components/reset-password-form";
import { getSession } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
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

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

  const { token } = await searchParams;

  if (!token) {
    redirect("/mot-de-passe-oublie");
  }

  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/nouveau-mot-de-passe/#webpage`,
    name: `Nouveau mot de passe | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/nouveau-mot-de-passe`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-muted-foreground">
              Choisissez un nouveau mot de passe pour votre compte
            </p>
          </header>

          <ResetPasswordForm token={token} />
        </div>
      </main>
    </>
  );
}
