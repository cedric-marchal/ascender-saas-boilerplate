import { ResetPasswordForm } from "@/features/auth/components/forms/reset-password-form";
import { getResetPasswordSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";

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

      <Main className="bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-muted-foreground text-sm">
              Choisissez un nouveau mot de passe pour votre compte
            </p>
          </header>

          <ResetPasswordForm token={token} />
        </div>
      </Main>
    </>
  );
}

export { ResetPasswordPage };
