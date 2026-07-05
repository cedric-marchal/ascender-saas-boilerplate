import { getTranslator } from "@/i18n/get-translator";
import { getLocale } from "next-intl/server";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
} from "@/utils/errors/errors";
import { translateAppError } from "@/utils/errors/translate-app-error";

function parseUserRole(role: string): UserRole {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error(`Invalid role in session: ${role}`);
  }

  return role as UserRole;
}

export const actionClient = createSafeActionClient({
  async handleServerError(error: Error) {
    console.error("Action error:", error.message);

    const locale = await getLocale();

    if (error instanceof AppError) {
      return translateAppError(error, locale);
    }

    console.error("Unexpected action error:", error);

    if (process.env.NODE_ENV === "development") {
      return error.message;
    }

    return getTranslator(locale)("errors.common.unexpectedServerError");
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
    throw new UnauthorizedError("errors.common.unauthenticated");
  }

  const activeOrganizationId =
    (session as { activeOrganizationId?: string | null })
      .activeOrganizationId ?? null;

  return next({
    ctx: {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      userRole: parseUserRole(session.user.role),
      activeOrganizationId,
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
    throw new ForbiddenError("errors.common.adminOnly");
  }

  return next({ ctx });
});

/**
 * Org action client (organization-scoped actions)
 * Use this for actions that require active organization membership
 * Provides userId, organizationId, and member role in context
 */
export const orgActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!ctx.activeOrganizationId) {
    throw new ForbiddenError("errors.common.noActiveOrganization");
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId: ctx.userId,
      organizationId: ctx.activeOrganizationId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("errors.common.notOrganizationMember");
  }

  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.activeOrganizationId,
      memberRole: membership.role,
    },
  });
});
