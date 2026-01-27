import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/session";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AdminSidebar } from "@/app/(protected)/admin/_components/admin-sidebar";

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
