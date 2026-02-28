import type { Metadata } from "next";

import { SettingsPage } from "@/features/account/pages/settings-page";

import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsRoute() {
  const session = await requireAdmin();

  return (
    <SettingsPage
      user={{
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
      }}
    />
  );
}
