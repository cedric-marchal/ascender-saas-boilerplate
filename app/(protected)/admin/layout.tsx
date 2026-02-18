import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/session";

import { AdminSidebar } from "@/components/protected/admin/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
      <SidebarTrigger />
      {children}
    </SidebarProvider>
  );
}
