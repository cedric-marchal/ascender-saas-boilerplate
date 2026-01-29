import type { Metadata } from "next";

import { requireCustomer } from "@/lib/session";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DashboardSettingsHeader } from "@/app/(protected)/dashboard/parametres/_components/dashboard-settings-header";
import { DashboardAvatarForm } from "@/app/(protected)/dashboard/parametres/_components/forms/dashboard-avatar-form";
import { DashboardPasswordForm } from "@/app/(protected)/dashboard/parametres/_components/forms/dashboard-password-form";
import { DashboardProfileForm } from "@/app/(protected)/dashboard/parametres/_components/forms/dashboard-profile-form";

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
      <DashboardSettingsHeader />

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
              <DashboardProfileForm
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
              <DashboardPasswordForm />
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
              <DashboardAvatarForm
                name={session.user.name}
                image={session.user.image}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
