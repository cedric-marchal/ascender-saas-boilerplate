import type { ReactNode } from "react";

import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { getUserOrganizations } from "@/features/organizations/services/get-user-organizations.service";

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
  params: Promise<{ locale: string }>;
};

export default async function ProtectedDashboardLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const session = await requireSession();

  const organizations = await getUserOrganizations({
    userId: session.user.id,
  });

  return (
    <SidebarProvider>
      <DashboardSidebar
        image={session.user.image}
        name={session.user.name}
        organizations={organizations}
        activeOrganizationId={session.activeOrganizationId}
      />
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
