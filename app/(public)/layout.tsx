import type { ReactNode } from "react";

import { Footer } from "@/app/(public)/_components/footer";
import { Header } from "@/app/(public)/_components/header";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
