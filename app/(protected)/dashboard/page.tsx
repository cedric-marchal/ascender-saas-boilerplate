import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardHomePage } from "@/features/dashboard/pages/dashboard-home-page";

import { UserRole } from "@/lib/generated/prisma/client";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardRoute() {
  const session = await requireSession();

  if (session.user.role === UserRole.ADMIN) {
    return redirect("/admin");
  }

  return <DashboardHomePage userName={session.user.name} />;
}
