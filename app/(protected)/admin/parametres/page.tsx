import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AdminSettingsHeader } from "@/app/(protected)/admin/parametres/_components/admin-settings-header";
import { AdminAvatarForm } from "@/app/(protected)/admin/parametres/_components/forms/admin-avatar-form";
import { AdminPasswordForm } from "@/app/(protected)/admin/parametres/_components/forms/admin-password-form";
import { AdminProfileForm } from "@/app/(protected)/admin/parametres/_components/forms/admin-profile-form";

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
    throw new Error("Utilisateur introuvable");
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
              <AdminProfileForm user={user} />
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
              <AdminPasswordForm />
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
              <AdminAvatarForm user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
