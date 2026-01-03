import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import Link from "next/link";

import { env } from "@/lib/env";

import { SignInForm } from "@/app/(public)/(auth)/connexion/_components/sign-in-form";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Connectez-vous à votre compte ${APP_NAME}. Accédez à votre tableau de bord et gérez vos projets.`;

export const metadata: Metadata = {
  title: "Connexion",
  description: DESCRIPTION,
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
    index: false,
    follow: true,
  },
};

export default function SignInPage() {
  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/connexion/#webpage`,
    name: `Connexion | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/connexion`,
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
            <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
            <p className="text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre compte
            </p>
          </header>

          <SignInForm />

          <p className="text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/inscription"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
