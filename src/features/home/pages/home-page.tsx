import { getLocale, getTranslations } from "next-intl/server";

import {
  getHomeOrganizationSchema,
  getHomeWebsiteSchema,
} from "@/features/home/constants/home-seo.constant";

import { Main } from "@/components/main";

async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  const websiteSchema = getHomeWebsiteSchema(
    locale,
    t("seoDescription", { appName: tCommon("appName") }),
  );
  const organizationSchema = getHomeOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <Main className="flex items-center justify-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </Main>
    </>
  );
}

export { HomePage };
