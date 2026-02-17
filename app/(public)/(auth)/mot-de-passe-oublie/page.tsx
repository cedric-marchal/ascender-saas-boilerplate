import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/features/auth/components/forms/forgot-password-form";
import { ArrowLeft } from "lucide-react";
import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Réinitialisez votre mot de passe ${APP_NAME}. Recevez un lien de réinitialisation par email.`;

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: DESCRIPTION,
  alternates: {
    canonical: "/mot-de-passe-oublie",
  },
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

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/mot-de-passe-oublie/#webpage`,
    name: `Mot de passe oublié | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/mot-de-passe-oublie`,
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

      <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Mot de passe oublié
            </h1>
            <p className="text-muted-foreground text-sm">
              Entrez votre adresse email pour recevoir un lien de
              réinitialisation
            </p>
          </header>

          <ForgotPasswordForm />

          <Link
            href="/connexion"
            className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la connexion
          </Link>
        </div>
      </main>
    </>
  );
}
