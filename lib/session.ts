import "server-only";

import { cache } from "react";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { ROLE_DASHBOARD_URL } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

type RawSession = typeof auth.$Infer.Session;

type Session = Omit<RawSession, "user"> & {
  user: Omit<RawSession["user"], "role"> & {
    role: UserRole;
  };
  activeOrganizationId: string | null;
};

function parseUserRole(role: string): UserRole {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error(`Invalid role in session: ${role}`);
  }

  return role as UserRole;
}

/**
 * Retrieves the session (memoized during rendering)
 * Returns null if not signed in
 */
const getSession = cache(async (): Promise<Session | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: parseUserRole(session.user.role),
    },
    activeOrganizationId:
      (session as { activeOrganizationId?: string | null })
        .activeOrganizationId ?? null,
  };
});

/**
 * Verifies the user is not signed in (guest)
 * Redirects to the appropriate dashboard by role if signed in
 * Use in public pages reserved for guests (sign-in, sign-up, etc.)
 */
const requireGuest = async (): Promise<void> => {
  const session = await getSession();

  if (session) {
    const locale = await getLocale();

    redirect({ href: ROLE_DASHBOARD_URL[session.user.role], locale });
  }
};

/**
 * Retrieves the session or redirects to sign-in
 * Use in EVERY protected page
 */
const requireSession = async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    const locale = await getLocale();

    return redirect({ href: "/sign-in", locale });
  }

  return session;
};

/**
 * Retrieves the customer session or shows 404
 * Use in customer pages that do not require a verified email
 */
const requireCustomer = async (): Promise<Session> => {
  const session = await requireSession();

  if (session.user.role !== UserRole.CUSTOMER) {
    return notFound();
  }

  return session;
};

/**
 * Retrieves the customer session and verifies the email is verified
 * Redirects to /dashboard/settings if the email is not verified
 * Use in customer pages that require a verified email
 */
const requireCustomerVerifiedEmail = async (): Promise<Session> => {
  const session = await requireCustomer();

  if (!session.user.emailVerified) {
    const locale = await getLocale();

    return redirect({ href: "/dashboard/settings", locale });
  }

  return session;
};

/**
 * Retrieves the admin session or shows 404
 * Use in admin pages that do not require a verified email
 */
const requireAdmin = async (): Promise<Session> => {
  const session = await requireSession();

  if (session.user.role !== UserRole.ADMIN) {
    return notFound();
  }

  return session;
};

/**
 * Retrieves the admin session and verifies the email is verified
 * Shows 404 if not admin or if the email is not verified
 * Use in admin pages that require a verified email
 */
const requireAdminVerifiedEmail = async (): Promise<Session> => {
  const session = await requireAdmin();

  if (!session.user.emailVerified) {
    const locale = await getLocale();

    return redirect({ href: "/admin/settings", locale });
  }

  return session;
};

/**
 * Verifies the user is a member of the given organization
 * Throws a ForbiddenError if not a member
 */
async function requireOrganizationMembership(
  userId: string,
  organizationId: string,
): Promise<string> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("errors.common.notOrganizationMember");
  }

  return membership.role;
}

export {
  getSession,
  requireAdmin,
  requireAdminVerifiedEmail,
  requireCustomer,
  requireCustomerVerifiedEmail,
  requireGuest,
  requireOrganizationMembership,
  requireSession,
};

export type { Session };
