import { getLocale, getTranslations } from "next-intl/server";

import { getLegalPageSchema } from "@/features/legal/constants/legal-seo.constant";
import { CookiePolicyContentEn } from "@/features/legal/content/cookie-policy-content.en";
import { CookiePolicyContentFr } from "@/features/legal/content/cookie-policy-content.fr";

import { Main } from "@/components/main";

const COOKIE_POLICY_CONTENT = {
  en: CookiePolicyContentEn,
  fr: CookiePolicyContentFr,
};

async function CookiePolicyPage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  const appName = tCommon("appName");
  const webPageSchema = getLegalPageSchema(
    "/cookie-policy",
    locale,
    `${t("cookiePolicy.title")} | ${appName}`,
    t("cookiePolicy.seoDescription", { appName }),
  );

  const CookiePolicyContent = COOKIE_POLICY_CONTENT[locale];

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
              {t("cookiePolicy.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              {t("lastUpdated")}
            </p>
          </header>

          <CookiePolicyContent appName={appName} />
        </article>
      </Main>
    </>
  );
}

export { CookiePolicyPage };
