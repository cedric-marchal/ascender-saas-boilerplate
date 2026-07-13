import type { ReactNode } from "react";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { CookieBanner } from "@/features/cookie-consent/components/cookie-banner";

import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";

type PublicLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PublicLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  return (
    <>
      <Header />
      {children}
      <Footer />
      <CookieBanner />
    </>
  );
}
