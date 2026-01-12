import type { Metadata } from "next";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Facturation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BillingPage() {
  await requireSession();

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Facturation</h1>
    </main>
  );
}
