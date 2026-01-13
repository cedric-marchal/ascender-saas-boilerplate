import type { Metadata } from "next";
import Link from "next/link";

import type { Product, WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Découvrez les tarifs de ${APP_NAME} : offres flexibles pour les indépendants, équipes et entreprises, sans engagement.`;

export const metadata: Metadata = {
  title: "Tarifs",
  description: DESCRIPTION,
  keywords: [
    "tarifs",
    "prix",
    "abonnements",
    APP_NAME.toLowerCase(),
    "saas pricing",
  ],
  alternates: {
    canonical: "/tarifs",
  },
  openGraph: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/tarifs",
  },
  twitter: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
  },
};

const PLANS = [
  {
    name: "Starter",
    description: "Pour démarrer et tester la plateforme en solo.",
    price: "0",
    period: "mois",
    features: [
      "1 projet actif",
      "Jusqu'à 3 espaces de travail",
      "Historique limité",
      "Support par e-mail standard",
    ],
    cta: "Commencer gratuitement",
    href: "/inscription",
    featured: false,
  },
  {
    name: "Pro",
    description: `Pour les indépendants et petites équipes qui utilisent ${APP_NAME} au quotidien.`,
    price: "19",
    period: "mois",
    features: [
      "Projets illimités",
      "Utilisateurs illimités dans votre équipe",
      "Historique étendu",
      "Support prioritaire par e-mail",
    ],
    cta: "Choisir l'offre Pro",
    href: "/inscription",
    featured: true,
  },
  {
    name: "Business",
    description: "Pour les équipes avancées et besoins spécifiques.",
    price: "Sur mesure",
    period: null,
    features: [
      "SLA et support dédié",
      "Intégrations avancées",
      "Accompagnement à l'onboarding",
      "Conditions contractuelles personnalisées",
    ],
    cta: "Parler avec l'équipe",
    href: "/contact",
    featured: false,
  },
] as const;

function getPricingSchemas(): WithContext<Product>[] {
  return PLANS.filter((plan) => plan.price !== "Sur mesure").map((plan) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${APP_NAME} ${plan.name}`,
    description: plan.description,
    brand: {
      "@type": "Brand",
      name: APP_NAME,
    },
    offers: {
      "@type": "Offer",
      price: plan.price,
      priceCurrency: "EUR",
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0],
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/tarifs`,
    },
  }));
}

export default function PricingPage() {
  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/tarifs/#webpage`,
    name: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/tarifs`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };

  const pricingSchemas = getPricingSchemas();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      {pricingSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}

      <main className="bg-background min-h-screen">
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

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.featured
                    ? "border-primary/40 ring-primary/20 ring-1"
                    : "border-muted"
                }
              >
                <CardHeader>
                  {plan.featured && (
                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                      Populaire
                    </p>
                  )}
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold">
                      {plan.price === "Sur mesure" ? (
                        plan.price
                      ) : (
                        <>
                          {plan.price} €
                          <span className="text-muted-foreground text-xs font-normal">
                            {" "}
                            / {plan.period}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <ul className="text-muted-foreground space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    variant={plan.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Les tarifs affichés sont présentés à titre indicatif et peuvent
            évoluer. Pour des besoins spécifiques ou des volumes importants,{" "}
            <Link
              href="/contact"
              className="hover:text-foreground underline underline-offset-4"
            >
              contactez-nous
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  );
}
