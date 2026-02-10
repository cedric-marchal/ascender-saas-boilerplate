import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from "@/utils/errors/errors";

class ActionError extends Error {}

/**
 * Base action client (public actions)
 * Use this for actions that don't require authentication
 */
export const actionClient = createSafeActionClient({
  handleServerError(error: Error) {
    console.error("Action error:", error.message);

    if (error instanceof BadRequestError) {
      return error.message;
    }

    if (error instanceof UnauthorizedError) {
      return error.message;
    }

    if (error instanceof ForbiddenError) {
      return error.message;
    }

    if (error instanceof NotFoundError) {
      return error.message;
    }

    if (error instanceof ConflictError) {
      return error.message;
    }

    if (error instanceof PayloadTooLargeError) {
      return error.message;
    }

    if (error instanceof UnsupportedMediaTypeError) {
      return error.message;
    }

    if (error instanceof UnprocessableEntityError) {
      return error.message;
    }

    if (error instanceof TooManyRequestsError) {
      return error.message;
    }

    if (error instanceof ServiceUnavailableError) {
      return error.message;
    }

    if (error instanceof ActionError) {
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
    },
  });
});

/**
 * Admin action client (admin-only actions)
 * Use this for actions that require admin role
 * Provides userId and ensures user is admin
 */
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
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
