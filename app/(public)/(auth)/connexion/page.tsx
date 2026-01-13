import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

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

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    return redirect("/dashboard");
  }

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

      <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
            <p className="text-muted-foreground text-sm">
              Entrez vos identifiants pour accéder à votre compte
            </p>
          </header>

          <SignInForm />

          <p className="text-muted-foreground text-center text-sm">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/inscription"
              className="text-foreground hover:text-primary font-medium underline underline-offset-4"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
