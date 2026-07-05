import type { Metadata } from "next";

import { getLocaleAlternates } from "@/i18n/get-locale-alternates";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactPage } from "@/features/contact/pages/contact-page";

type ContactRouteProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ContactRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "contact",
  });
  const tCommon = await getTranslations({
    locale: locale as Locale,
    namespace: "common",
  });

  const appName = tCommon("appName");
  const description = t("seo.description", { appName });
  const alternates = getLocaleAlternates("/contact", locale as Locale);

  return {
    title: t("heading"),
    description,
    keywords: [...t.raw("seo.keywords"), appName.toLowerCase()],
    alternates,
    openGraph: {
      title: `${t("heading")} | ${appName}`,
      description,
      url: alternates.canonical,
    },
    twitter: {
      title: `${t("heading")} | ${appName}`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ContactRoute({ params }: ContactRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return <ContactPage />;
}
