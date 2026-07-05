import { getLocale, getTranslations } from "next-intl/server";

import { getLegalPageSchema } from "@/features/legal/constants/legal-seo.constant";
import { PrivacyPolicyContentEn } from "@/features/legal/content/privacy-policy-content.en";
import { PrivacyPolicyContentFr } from "@/features/legal/content/privacy-policy-content.fr";

import { Main } from "@/components/main";

const PRIVACY_POLICY_CONTENT = {
  en: PrivacyPolicyContentEn,
  fr: PrivacyPolicyContentFr,
};

async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  const appName = tCommon("appName");
  const webPageSchema = getLegalPageSchema(
    "/privacy-policy",
    locale,
    `${t("privacyPolicy.title")} | ${appName}`,
    t("privacyPolicy.seoDescription", { appName }),
  );

  const PrivacyPolicyContent = PRIVACY_POLICY_CONTENT[locale];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <Main>
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <header className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("privacyPolicy.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              {t("lastUpdated")}
            </p>
          </header>

          <PrivacyPolicyContent appName={appName} />
        </article>
      </Main>
    </>
  );
}

export { PrivacyPolicyPage };
