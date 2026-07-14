import type { ReactNode } from "react";

import { getLocale, getTranslations } from "next-intl/server";
import type { Product, WebPage, WithContext } from "schema-dts";

import { getPricingPlans } from "@/features/pricing/constants/pricing-plans";
import {
  getPricingProductSchemas,
  getPricingWebPageSchema,
} from "@/features/pricing/constants/pricing-seo.constant";

import { Main } from "@/components/main";

type PricingPageProps = {
  children: ReactNode;
};

async function PricingPage({ children }: PricingPageProps) {
  const locale = await getLocale();
  const t = await getTranslations("pricing");
  const tCommon = await getTranslations("common");
  const plans = await getPricingPlans();

  const description = t("seo.description", { appName: tCommon("appName") });

  const webPageSchema: WithContext<WebPage> = getPricingWebPageSchema(
    locale,
    description,
  );
  const productSchemas: WithContext<Product>[] = getPricingProductSchemas(
    locale,
    plans,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      {productSchemas.map((schema: WithContext<Product>, index: number) => (
        <script
          key={String(schema["@id"] ?? index)}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}

      <Main>
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:px-8 lg:py-20">
          <header className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("heading")}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("subheading", { appName: tCommon("appName") })}
            </p>
          </header>

          {children}

          <p className="text-muted-foreground text-center text-xs">
            {t("footerNote")}
          </p>
        </section>
      </Main>
    </>
  );
}

export { PricingPage };
