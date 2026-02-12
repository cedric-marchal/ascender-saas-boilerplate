import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AvatarForm } from "@/app/(protected)/_components/forms/avatar-form";
import { PasswordForm } from "@/app/(protected)/_components/forms/password-form";
import { ProfileForm } from "@/app/(protected)/_components/forms/profile-form";
import { DeleteAccountModal } from "@/app/(protected)/_components/modals/delete-account-modal";
import { AdminSettingsHeader } from "@/app/(protected)/admin/parametres/_components/admin-settings-header";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsPage() {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
    },
  });

  if (!user) {
    return notFound();
  }

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <AdminSettingsHeader />

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
                name={user.name}
                email={user.email}
                emailVerified={user.emailVerified}
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
              <AvatarForm name={user.name} image={user.image} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Zone de danger</CardTitle>
          <CardDescription className="text-red-600">
            La suppression de votre compte est irréversible. Toutes vos données
            seront définitivement supprimées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountModal email={user.email} />
        </CardContent>
      </Card>
    </main>
  );
}
