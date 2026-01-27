import type { Metadata } from "next";

import { requireSession } from "@/lib/session";

import { AvatarForm } from "@/app/(protected)/dashboard/parametres/_components/forms/avatar-form";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardSettingsPage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-screen flex-col p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos informations personnelles
        </p>
      </header>

      <section className="max-w-2xl space-y-8">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-6 text-xl font-semibold">Photo de profil</h2>
          <AvatarForm
            currentAvatarUrl={session.user.image ?? undefined}
            userName={session.user.name}
          />
        </div>
      </section>
    </main>
  );
}
