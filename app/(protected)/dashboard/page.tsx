import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === "ADMIN") {
    return redirect("/admin");
  }

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Bienvenue, {session.user.name}
      </p>
    </main>
  );
}
