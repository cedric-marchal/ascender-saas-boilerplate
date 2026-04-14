import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/features/auth/components/forms/forgot-password-form";
import { getForgotPasswordSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ForgotPasswordPage() {
  const webPageSchema = getForgotPasswordSchema();

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
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de
              réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ForgotPasswordForm />

            <Link
              href="/connexion"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { ForgotPasswordPage };
