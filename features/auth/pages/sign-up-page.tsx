import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SignUpForm } from "@/features/auth/components/forms/sign-up-form";
import { getAuthPageSchema } from "@/features/auth/constants/auth-seo.constant";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function SignUpPage() {
  const locale = await getLocale();
  const t = await getTranslations("auth.signUp");
  const tCommon = await getTranslations("common");

  const webPageSchema = getAuthPageSchema(
    "/sign-up",
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
            <SignUpForm />

            <p className="text-muted-foreground text-center text-sm">
              {t("haveAccount")}{" "}
              <Link
                href="/sign-in"
                className="text-foreground hover:text-primary font-medium underline underline-offset-4"
              >
                {t("signInLink")}
              </Link>
            </p>

            <p className="text-muted-foreground text-center text-xs">
              {t("termsPrefix")}{" "}
              <Link
                href="/legal-notice"
                className="hover:text-foreground underline underline-offset-4"
              >
                {t("legalNoticeLink")}
              </Link>{" "}
              {t("and")}{" "}
              <Link
                href="/privacy-policy"
                className="hover:text-foreground underline underline-offset-4"
              >
                {t("privacyPolicyLink")}
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
