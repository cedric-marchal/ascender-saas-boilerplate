import type { ReactNode } from "react";

import { AppSidebar } from "@/app/(protected)/_components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";

import { redirect } from "next/navigation";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({
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
