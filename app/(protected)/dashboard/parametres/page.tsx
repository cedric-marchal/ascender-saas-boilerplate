import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardSettingsPage() {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre compte.
        </p>
      </div>
    </main>
  );
}
