import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/session";

import { AdminSidebar } from "@/components/protected/admin/admin-sidebar";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  const session = await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar image={session.user.image} name={session.user.name} />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <ScrollToTop />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
