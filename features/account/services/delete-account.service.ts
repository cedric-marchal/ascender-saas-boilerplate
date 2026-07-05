import "server-only";

import { getTranslator } from "@/i18n/get-translator";
import { getLocale } from "next-intl/server";

import { AccountDeletedEmail } from "@/features/account/emails/account-deleted-email";
import { cleanupBillingForOrganization } from "@/features/billing/services/cleanup-billing.service";
import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { env } from "@/lib/env";
import { UserRole } from "@/lib/generated/prisma/client";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/r2";
import { sendEmail } from "@/lib/resend";

import { BadRequestError, ForbiddenError } from "@/utils/errors/errors";

const AVATAR_FOLDER = "avatars";

type DeleteAccountInput = {
  userId: string;
  userName: string;
  confirmation: string;
};

async function checkLastAdmin(role: UserRole): Promise<void> {
  if (role !== UserRole.ADMIN) {
    return;
  }

  const adminCount = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
    },
  });

  if (adminCount <= 1) {
    throw new ForbiddenError("errors.account.onlyAdminCannotDelete");
  }
}

async function cleanupAvatar(image: string | null): Promise<void> {
  if (!image || !image.startsWith(AVATAR_FOLDER)) {
    return;
  }

  try {
    await deleteFile(image);
  } catch (error: unknown) {
    logger.error("Failed to delete user avatar", {
      image,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function deleteAccount(input: DeleteAccountInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      id: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    throw new BadRequestError("errors.account.userNotFound");
  }

  if (input.confirmation !== user.email) {
    throw new BadRequestError("errors.account.confirmationEmailMismatch");
  }

  await checkLastAdmin(user.role);

  // Find all orgs where this user is a member
  const userMemberships = await prisma.member.findMany({
    where: {
      userId: input.userId,
    },
    select: {
      organizationId: true,
      role: true,
    },
    take: 50,
  });

  // For each owned org, determine if this user is the sole owner
  const orgIds = userMemberships
    .filter((membership) => membership.role === "owner")
    .map((membership) => membership.organizationId);

  const soleOwnedOrgIds: string[] = [];
  const nonSoleOwnedOrgIds: string[] = [];

  for (const orgId of orgIds) {
    const ownerCount = await prisma.member.count({
      where: {
        organizationId: orgId,
        role: "owner",
      },
    });

    if (ownerCount <= 1) {
      soleOwnedOrgIds.push(orgId);
    } else {
      nonSoleOwnedOrgIds.push(orgId);
    }
  }

  // Gather Stripe customer IDs for sole-owned orgs before deletion
  const soleOwnedOrgs = await prisma.organization.findMany({
    where: {
      id: {
        in: soleOwnedOrgIds,
      },
    },
    select: {
      id: true,
      stripeCustomer: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
    take: 50,
  });

  // Audit account deletion for each org the user belongs to (best-effort, before deletion)
  for (const membership of userMemberships) {
    await logEvent({
      organizationId: membership.organizationId,
      userId: input.userId,
      action: AUDIT_ACTION.ACCOUNT_DELETED,
      entityType: "user",
      entityId: input.userId,
    });
  }

  // Primary action: delete from DB (cascades to sessions, accounts, member records)
  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  // Cascade-delete sole-owned orgs (their StripeCustomer FK cascades in DB, but
  // we must also cancel Stripe subscription and clean Redis)
  for (const org of soleOwnedOrgs) {
    if (org.stripeCustomer) {
      await cleanupBillingForOrganization(
        org.stripeCustomer.stripeCustomerId,
        org.id,
      );
    }

    // Delete the org itself (members already gone via user cascade)
    try {
      await prisma.organization.delete({
        where: {
          id: org.id,
        },
      });
    } catch (error: unknown) {
      logger.error("Failed to cascade-delete organization", {
        organizationId: org.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await cleanupAvatar(user.image);

  try {
    const locale = await getLocale();
    const translate = getTranslator(locale);

    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: user.email,
      subject: translate("emails.accountDeleted.subject", {
        appName: env.NEXT_PUBLIC_APP_NAME,
      }),
      react: AccountDeletedEmail({
        name: input.userName,
        locale,
      }),
    });
  } catch (error: unknown) {
    logger.error("Failed to send account deletion email", {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export { deleteAccount };

export type { DeleteAccountInput };
