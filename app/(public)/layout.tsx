import type { ReactNode } from "react";

import { Header } from "@/app/(public)/_components/header";
import { Footer } from "@/app/(public)/_components/footer";

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
