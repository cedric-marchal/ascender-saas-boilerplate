import { getLocale, getTranslations } from "next-intl/server";

import { getLegalPageSchema } from "@/features/legal/constants/legal-seo.constant";
import { TermsOfSaleContentEn } from "@/features/legal/content/terms-of-sale-content.en";
import { TermsOfSaleContentFr } from "@/features/legal/content/terms-of-sale-content.fr";

import { Main } from "@/components/main";

const TERMS_OF_SALE_CONTENT = {
  en: TermsOfSaleContentEn,
  fr: TermsOfSaleContentFr,
};

async function TermsOfSalePage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  const appName = tCommon("appName");
  const webPageSchema = getLegalPageSchema(
    "/terms-of-sale",
    locale,
    `${t("termsOfSale.title")} | ${appName}`,
    t("termsOfSale.seoDescription", { appName }),
  );

  const TermsOfSaleContent = TERMS_OF_SALE_CONTENT[locale];

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
              {t("termsOfSale.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              {t("lastUpdated")}
            </p>
          </header>

          <TermsOfSaleContent appName={appName} />
        </article>
      </Main>
    </>
  );
}

export { TermsOfSalePage };
