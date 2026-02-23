import type { Metadata } from "next";

import { AvatarForm } from "@/features/account/components/forms/avatar-form";
import { PasswordForm } from "@/features/account/components/forms/password-form";
import { ProfileForm } from "@/features/account/components/forms/profile-form";
import { DeleteAccountModal } from "@/features/account/components/modals/delete-account-modal";
import { SettingsHeader } from "@/features/account/components/settings-header";

import { requireCustomer } from "@/lib/session";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardSettingsPage() {
  const session = await requireCustomer();

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <SettingsHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour votre nom et votre adresse email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                name={session.user.name}
                email={session.user.email}
                emailVerified={session.user.emailVerified}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Personnalisez votre avatar visible par les autres utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarForm name={session.user.name} image={session.user.image} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Zone de danger</CardTitle>
          <CardDescription className="text-red-600">
            La suppression de votre compte est irréversible. Toutes vos données
            et votre abonnement seront définitivement supprimés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountModal email={session.user.email} showStripeWarning />
        </CardContent>
      </Card>
    </main>
  );
}
