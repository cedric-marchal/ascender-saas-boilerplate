import type { ReactNode } from "react";

import { requireSession } from "@/lib/session";

import { DashboardSidebar } from "@/components/protected/dashboard/dashboard-sidebar";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedDashboardLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await requireSession();

  return (
    <SidebarProvider>
      <DashboardSidebar image={session.user.image} name={session.user.name} />
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
