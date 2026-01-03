import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import Link from "next/link";

import { env } from "@/lib/env";

import { SignUpForm } from "@/app/(public)/(auth)/inscription/_components/sign-up-form";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Créez votre compte ${APP_NAME} gratuitement. Accédez à toutes les fonctionnalités en quelques secondes.`;

export const metadata: Metadata = {
  title: "Inscription",
  description: DESCRIPTION,
  alternates: {
    canonical: "/inscription",
  },
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
    index: false,
    follow: true,
  },
};

export default function SignUpPage() {
  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/inscription/#webpage`,
    name: `Inscription | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/inscription`,
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
              Créer un compte
            </h1>
            <p className="text-sm text-muted-foreground">
              Entrez vos informations pour créer votre compte
            </p>
          </header>

          <SignUpForm />

          <p className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            En créant un compte, vous acceptez nos{" "}
            <Link
              href="/mentions-legales"
              className="underline underline-offset-4 hover:text-foreground"
            >
              mentions légales
            </Link>{" "}
            et notre{" "}
            <Link
              href="/politique-de-confidentialite"
              className="underline underline-offset-4 hover:text-foreground"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
