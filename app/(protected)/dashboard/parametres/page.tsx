import type { Metadata } from "next";

import { requireSession } from "@/lib/session";
import { getDownloadUrl } from "@/lib/r2";

import { EmailVerificationAlert } from "@/app/(protected)/dashboard/parametres/_components/email-verification-alert";
import { AvatarForm } from "@/app/(protected)/dashboard/parametres/_components/avatar-form";
import { ProfileForm } from "@/app/(protected)/dashboard/parametres/_components/profile-form";
import { EmailForm } from "@/app/(protected)/dashboard/parametres/_components/email-form";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const session = await requireSession();

  let avatarUrl: string | null = null;

  if (session.user.image?.startsWith("users/avatars/")) {
    avatarUrl = await getDownloadUrl(session.user.image);
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les paramètres de votre compte.
        </p>
      </div>

      {!session.user.emailVerified && <EmailVerificationAlert />}

      <AvatarForm
        user={{
          name: session.user.name,
          image: session.user.image,
        }}
        avatarUrl={avatarUrl}
      />

      <ProfileForm
        user={{
          name: session.user.name,
        }}
      />

      <EmailForm
        user={{
          email: session.user.email,
          emailVerified: session.user.emailVerified,
        }}
      />
    </main>
  );
}
