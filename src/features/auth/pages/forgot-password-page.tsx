import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "@/features/auth/components/forms/forgot-password-form";
import { getAuthPageSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function ForgotPasswordPage() {
  const locale = await getLocale();
  const t = await getTranslations("auth.forgotPassword");
  const tCommon = await getTranslations("common");

  const webPageSchema = getAuthPageSchema(
    "/forgot-password",
    locale,
    `${t("title")} | ${tCommon("appName")}`,
    t("seoDescription", { appName: tCommon("appName") }),
  );

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
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ForgotPasswordForm />

            <Link
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("backToSignIn")}
            </Link>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { ForgotPasswordPage };
