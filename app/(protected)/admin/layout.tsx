import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getSession, requireAdmin } from "@/lib/session";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AdminSidebar } from "@/app/(protected)/admin/_components/admin-sidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar image={session.user.image} name={session.user.name} />
      <SidebarTrigger />
      {children}
    </SidebarProvider>
  );
}
