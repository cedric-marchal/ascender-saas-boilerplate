import type { Product, WebPage, WithContext } from "schema-dts";

import { PricingGrid } from "@/features/pricing/components/pricing-grid";
import {
  getPricingProductSchemas,
  getPricingWebPageSchema,
} from "@/features/pricing/constants/pricing-seo.constant";

import { Main } from "@/components/main";
import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type PricingPageProps = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
};

function PricingPage({
  isAuthenticated,
  isEmailVerified,
  isCustomer,
}: PricingPageProps) {
  const webPageSchema: WithContext<WebPage> = getPricingWebPageSchema();
  const productSchemas: WithContext<Product>[] = getPricingProductSchemas();

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
          key={index}
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
              Des tarifs clairs, pensés pour grandir avec vous
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Que vous soyez indépendant, en petite équipe ou dans une structure
              plus large, {APP_NAME} propose des offres flexibles, sans
              engagement, pour vous permettre d&apos;avancer à votre rythme.
            </p>
          </header>

          <PricingGrid
            isAuthenticated={isAuthenticated}
            isEmailVerified={isEmailVerified}
            isCustomer={isCustomer}
          />

          <p className="text-muted-foreground text-center text-xs">
            Les tarifs affichés sont présentés à titre indicatif et peuvent
            évoluer. Pour des besoins spécifiques ou des volumes importants,
            contactez-nous.
          </p>
        </section>
      </Main>
    </>
  );
}

export { PricingPage };
