import type { ReactNode } from "react";

import { CookieBanner } from "@/features/cookie-consent/components/cookie-banner";

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
    </>
  );
}
