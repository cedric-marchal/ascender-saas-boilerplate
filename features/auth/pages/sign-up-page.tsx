import Link from "next/link";

import { SignUpForm } from "@/features/auth/components/forms/sign-up-form";
import { getSignUpSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Entrez vos informations pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { SignUpPage };
