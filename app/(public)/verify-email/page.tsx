import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckCircle2, XCircle } from "lucide-react";
import { type SearchParams } from "nuqs/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Vérification de l'email",
  robots: {
    index: false,
    follow: false,
  },
};

type VerifyEmailPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  const params = await searchParams;
  const token = params.token as string | undefined;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Lien invalide</CardTitle>
            <CardDescription className="text-center">
              Le lien de vérification est invalide ou manquant.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/dashboard/parametres">Retour aux paramètres</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const verification = await prisma.verification.findFirst({
    where: {
      value: token,
    },
    select: {
      id: true,
      identifier: true,
      expiresAt: true,
    },
  });

  if (!verification) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Lien invalide</CardTitle>
            <CardDescription className="text-center">
              Ce lien de vérification n&apos;existe pas ou a déjà été utilisé.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/dashboard/parametres">Retour aux paramètres</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (new Date() > verification.expiresAt) {
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <XCircle className="h-6 w-6 text-orange-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Lien expiré</CardTitle>
            <CardDescription className="text-center">
              Ce lien de vérification a expiré. Veuillez demander un nouveau
              lien depuis vos paramètres.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/dashboard/parametres">Retour aux paramètres</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: verification.identifier },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">
              Utilisateur introuvable
            </CardTitle>
            <CardDescription className="text-center">
              L&apos;adresse email associée à ce lien n&apos;existe plus.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/dashboard/parametres">Retour aux paramètres</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (user.id !== session.user.id) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-center">Accès non autorisé</CardTitle>
            <CardDescription className="text-center">
              Ce lien de vérification appartient à un autre utilisateur.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" asChild>
              <Link href="/dashboard/parametres">Retour aux paramètres</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
    prisma.verification.delete({
      where: { id: verification.id },
    }),
  ]);

  await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              className="h-6 w-6 text-green-600"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-center">
            Email vérifié avec succès
          </CardTitle>
          <CardDescription className="text-center">
            Votre adresse email a été vérifiée. Vous pouvez maintenant utiliser
            toutes les fonctionnalités de votre compte.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button type="button" asChild>
            <Link href="/dashboard">Accéder au tableau de bord</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
