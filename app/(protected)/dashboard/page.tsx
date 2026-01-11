import type { Metadata } from "next";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenue, {session.user.name}
      </p>
      <SignOutButton />
    </main>
  );
}
