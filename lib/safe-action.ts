import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";

import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";

import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
} from "@/utils/errors/errors";

function parseUserRole(role: string): UserRole {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error(`Role invalide dans la session: ${role}`);
  }
  return role as UserRole;
}

export const actionClient = createSafeActionClient({
  handleServerError(error: Error) {
    console.error("Action error:", error.message);

    if (error instanceof AppError) {
      return error.message;
    }

    if (process.env.NODE_ENV === "development") {
      return error.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

/**
 * Auth action client (protected actions)
 * Use this for actions that require authentication
 * Provides userId in context
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user) {
    throw new UnauthorizedError("Vous devez être connecté");
  }

  return next({
    ctx: {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      userRole: parseUserRole(session.user.role),
    },
  });
});

/**
 * Admin action client (admin-only actions)
 * Use this for actions that require admin role
 * Provides userId and ensures user is admin
 */
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.userRole !== UserRole.ADMIN) {
    throw new ForbiddenError(
      "Accès non autorisé. Vous devez être administrateur."
    );
  }

  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
    },
  });
});
