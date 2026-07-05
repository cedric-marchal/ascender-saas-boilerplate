import { getLocale, getTranslations } from "next-intl/server";

import { getLegalPageSchema } from "@/features/legal/constants/legal-seo.constant";
import { TermsOfServiceContentEn } from "@/features/legal/content/terms-of-service-content.en";
import { TermsOfServiceContentFr } from "@/features/legal/content/terms-of-service-content.fr";

import { Main } from "@/components/main";

const TERMS_OF_SERVICE_CONTENT = {
  en: TermsOfServiceContentEn,
  fr: TermsOfServiceContentFr,
};

async function TermsOfServicePage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  const appName = tCommon("appName");
  const webPageSchema = getLegalPageSchema(
    "/terms-of-service",
    locale,
    `${t("termsOfService.title")} | ${appName}`,
    t("termsOfService.seoDescription", { appName }),
  );

  const TermsOfServiceContent = TERMS_OF_SERVICE_CONTENT[locale];

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
              {t("termsOfService.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              {t("lastUpdated")}
            </p>
          </header>

          <TermsOfServiceContent appName={appName} />
        </article>
      </Main>
    </>
  );
}

export { TermsOfServicePage };
