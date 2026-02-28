import Link from "next/link";

import { SignInForm } from "@/features/auth/components/forms/sign-in-form";
import { getSignInSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";

function SignInPage() {
  const webPageSchema = getSignInSchema();

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
      </Main>
    </>
  );
}

export { SignInPage };
