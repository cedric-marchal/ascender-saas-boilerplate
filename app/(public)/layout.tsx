import type { ReactNode } from "react";

import { CookieBanner } from "@/features/cookie-consent/components/cookie-banner";
import { GoogleAnalytics } from "@/features/cookie-consent/components/google-analytics";

import { env } from "@/lib/env";

import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <CookieBanner />
      {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </>
  );
}
