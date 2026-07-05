import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { getPathname, Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

type SitemapLink = {
  labelKey: string;
  href:
    | "/"
    | "/pricing"
    | "/contact"
    | "/sign-up"
    | "/sign-in"
    | "/legal-notice"
    | "/privacy-policy"
    | "/cookie-policy"
    | "/terms-of-service"
    | "/terms-of-sale";
};

type SitemapSection = {
  titleKey: string;
  links: SitemapLink[];
};

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

const STATIC_SECTIONS: SitemapSection[] = [
  {
    titleKey: "navigation",
    links: [
      { labelKey: "navigation.home", href: "/" },
      { labelKey: "navigation.pricing", href: "/pricing" },
      { labelKey: "navigation.contact", href: "/contact" },
    ],
  },
  {
    titleKey: "account",
    links: [
      { labelKey: "account.signUp", href: "/sign-up" },
      { labelKey: "account.signIn", href: "/sign-in" },
    ],
  },
  {
    titleKey: "legal",
    links: [
      { labelKey: "legal.legalNotice", href: "/legal-notice" },
      { labelKey: "legal.privacyPolicy", href: "/privacy-policy" },
      { labelKey: "legal.cookiePolicy", href: "/cookie-policy" },
      { labelKey: "legal.termsOfService", href: "/terms-of-service" },
      { labelKey: "legal.termsOfSale", href: "/terms-of-sale" },
    ],
  },
];

async function SitemapPage() {
  const locale = await getLocale();
  const t = await getTranslations("common.sitemapPage");
  const pathname = getPathname({ href: "/sitemap-page", locale });

  const webPageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${pathname}/#webpage`,
    name: `${APP_NAME}`,
    description: t("seoDescription", { appName: APP_NAME }),
    url: `${BASE_URL}${pathname}`,
    inLanguage: LOCALE_METADATA[locale].bcp47,
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
          <header className="mb-12 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("description", { appName: APP_NAME })}
            </p>
          </header>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {STATIC_SECTIONS.map((section: SitemapSection) => (
              <section key={section.titleKey}>
                <h2 className="mb-4 text-base font-semibold">
                  {t(`sections.${section.titleKey}.title`)}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link: SitemapLink) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
                      >
                        {t(`sections.${link.labelKey}`)}
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
