import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "@/app/(protected)/dashboard/_components/app-sidebar";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedDashboardLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  return (
    <SidebarProvider>
      <AppSidebar image={session.user.image} name={session.user.name} />
      <SidebarTrigger />
      {children}
    </SidebarProvider>
  );
}
