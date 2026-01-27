import type { Metadata } from "next";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <p>ok</p>
    </main>
  );
}
