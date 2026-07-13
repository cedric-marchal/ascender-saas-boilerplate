import { getLocale, getTranslations } from "next-intl/server";

import { ResetPasswordForm } from "@/features/auth/components/forms/reset-password-form";
import { getAuthPageSchema } from "@/features/auth/constants/auth-seo.constant";

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

async function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const locale = await getLocale();
  const t = await getTranslations("auth.resetPassword");
  const tCommon = await getTranslations("common");

  const webPageSchema = getAuthPageSchema(
    "/reset-password",
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
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </Main>
    </>
  );
}

export { ResetPasswordPage };
