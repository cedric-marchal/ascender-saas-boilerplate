import type { ReactNode } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { routing } from "@/i18n/routing";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function generateStaticParams() {
  return routing.locales.map((locale: string) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  return {
    openGraph: {
      locale: LOCALE_METADATA[locale].ogLocale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this request
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {/* `display: contents` keeps this node out of the layout tree while
          still carrying the correct `lang` for this locale subtree — the
          root `<html lang>` in app/layout.tsx stays static (defaultLocale)
          since it sits outside the `[locale]` segment. */}
      <div lang={locale} className="contents">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}

export { generateStaticParams };
