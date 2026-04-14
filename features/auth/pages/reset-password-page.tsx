import { ResetPasswordForm } from "@/features/auth/components/forms/reset-password-form";
import { getResetPasswordSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ResetPasswordPageProps = {
  token: string;
};

function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const webPageSchema = getResetPasswordSchema();

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
            <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
            <CardDescription>
              Choisissez un nouveau mot de passe pour votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { ResetPasswordPage };
