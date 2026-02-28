import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/features/auth/components/forms/forgot-password-form";
import { getForgotPasswordSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";

function ForgotPasswordPage() {
  const webPageSchema = getForgotPasswordSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <Main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
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
      </Main>
    </>
  );
}

export { ForgotPasswordPage };
