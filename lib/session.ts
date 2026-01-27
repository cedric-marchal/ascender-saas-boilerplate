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

  return session;
});

/**
 * Récupère la session customer et vérifie que l'email est vérifié
 * Redirige vers /dashboard/parametres si l'email n'est pas vérifié
 * À utiliser dans les pages customer nécessitant un email vérifié
 */
const requireCustomerVerifiedEmail = cache(async (): Promise<Session> => {
  const session = await requireSession();

  if (!session.user.emailVerified) {
    return redirect("/dashboard/parametres");
  }

  return session;
});

/**
 * Récupère la session admin ou affiche 404
 * À utiliser dans les pages admin ne nécessitant pas d'email vérifié
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

/**
 * Récupère la session admin et vérifie que l'email est vérifié
 * Affiche 404 si non admin ou si l'email n'est pas vérifié
 * À utiliser dans les pages admin nécessitant un email vérifié
 */
const requireAdminVerifiedEmail = cache(async (): Promise<Session> => {
  const session = await requireAdmin();

  if (!session.user.emailVerified) {
    return redirect("/admin/parametres");
  }

  return session;
});

export {
  getSession,
  requireAdmin,
  requireAdminVerifiedEmail,
  requireCustomerVerifiedEmail,
  requireSession,
};
export type { Session };
