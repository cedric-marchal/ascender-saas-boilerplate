import type { WebPage, WithContext } from "schema-dts";

import Link from "next/link";

import { Main } from "@/components/main";

import { env } from "@/lib/env";

type SitemapLink = {
  label: string;
  href: string;
};

type SitemapSection = {
  title: string;
  links: SitemapLink[];
};

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = `Plan du site de ${APP_NAME}. Accédez rapidement à toutes les pages disponibles.`;

const STATIC_SECTIONS: SitemapSection[] = [
  {
    title: "Navigation",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Inscription", href: "/inscription" },
      { label: "Connexion", href: "/connexion" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      {
        label: "Politique de confidentialité",
        href: "/politique-de-confidentialite",
      },
      { label: "Politique des cookies", href: "/politique-des-cookies" },
      {
        label: "Conditions d'utilisation",
        href: "/conditions-d-utilisation",
      },
      { label: "Conditions de vente", href: "/conditions-de-vente" },
    ],
  },
];

function SitemapPage() {
  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/plan-du-site/#webpage`,
    name: `Plan du site | ${APP_NAME}`,
    description: DESCRIPTION,
    url: `${BASE_URL}/plan-du-site`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <Main>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Plan du site
          </h1>
          <p className="text-muted-foreground mt-4 text-sm">
            Accédez rapidement à toutes les pages disponibles sur {APP_NAME}.
          </p>
        </header>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {STATIC_SECTIONS.map((section: SitemapSection) => (
            <section key={section.title}>
              <h2 className="mb-4 text-base font-semibold">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link: SitemapLink) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      </Main>
    </>
  );
}

export { SitemapPage };
