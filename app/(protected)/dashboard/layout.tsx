import type { ReactNode } from "react";

import { requireSession } from "@/lib/session";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { DashboardSidebar } from "@/components/protected/dashboard/dashboard-sidebar";

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
      <SidebarTrigger />
      {children}
    </SidebarProvider>
  );
}
