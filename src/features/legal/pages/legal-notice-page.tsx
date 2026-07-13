import { getLocale, getTranslations } from "next-intl/server";

import { getLegalPageSchema } from "@/features/legal/constants/legal-seo.constant";
import { LegalNoticeContentEn } from "@/features/legal/content/legal-notice-content.en";
import { LegalNoticeContentFr } from "@/features/legal/content/legal-notice-content.fr";

import { Main } from "@/components/main";

const LEGAL_NOTICE_CONTENT = {
  en: LegalNoticeContentEn,
  fr: LegalNoticeContentFr,
};

async function LegalNoticePage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");

  const appName = tCommon("appName");
  const webPageSchema = getLegalPageSchema(
    "/legal-notice",
    locale,
    `${t("legalNotice.title")} | ${appName}`,
    t("legalNotice.seoDescription", { appName }),
  );

  const LegalNoticeContent = LEGAL_NOTICE_CONTENT[locale];

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
              {t("legalNotice.title")}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              {t("lastUpdated")}
            </p>
          </header>

          <LegalNoticeContent appName={appName} />
        </article>
      </Main>
    </>
  );
}

export { LegalNoticePage };
