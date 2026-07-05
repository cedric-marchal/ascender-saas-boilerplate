import { Link } from "@/i18n/navigation";

import { SignInForm } from "@/features/auth/components/forms/sign-in-form";
import { getSignInSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInForm />

            <p className="text-muted-foreground text-center text-sm">
              Vous n&apos;avez pas de compte ?{" "}
              <Link
                href="/sign-up"
                className="text-foreground hover:text-primary font-medium underline underline-offset-4"
              >
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { SignInPage };
