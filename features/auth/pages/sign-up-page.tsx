import Link from "next/link";

import { SignUpForm } from "@/features/auth/components/forms/sign-up-form";
import { getSignUpSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";

function SignUpPage() {
  const webPageSchema = getSignUpSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <Main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Créer un compte
            </h1>
            <p className="text-muted-foreground text-sm">
              Entrez vos informations pour créer votre compte
            </p>
          </header>

          <SignUpForm />

          <p className="text-muted-foreground text-center text-sm">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="text-foreground hover:text-primary font-medium underline underline-offset-4"
            >
              Se connecter
            </Link>
          </p>

          <p className="text-muted-foreground text-center text-xs">
            En créant un compte, vous acceptez nos{" "}
            <Link
              href="/mentions-legales"
              className="hover:text-foreground underline underline-offset-4"
            >
              mentions légales
            </Link>{" "}
            et notre{" "}
            <Link
              href="/politique-de-confidentialite"
              className="hover:text-foreground underline underline-offset-4"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </Main>
    </>
  );
}

export { SignUpPage };
