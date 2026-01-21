import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Session = typeof auth.$Infer.Session;

/**
 * Récupère la session (mémorisée pendant le rendu)
 * Retourne null si non connecté
 */
const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

/**
 * Récupère la session ou redirige vers connexion
 * À utiliser dans CHAQUE page protégée
 */
const requireSession = cache(async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    return redirect("/connexion");
  }

  /*
  if (!session.user.emailVerified) {
    return redirect("/dashboard/parametres");
  }*/

  return session;
});

/**
 * Récupère la session admin ou affiche 404
 * À utiliser dans CHAQUE page admin
 */
const requireAdmin = cache(async (): Promise<Session> => {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return notFound();
  }

  return session;
});

export { getSession, requireAdmin, requireSession };
export type { Session };
