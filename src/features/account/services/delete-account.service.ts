import "server-only";

import { getTranslator } from "@/i18n/get-translator";
import { getLocale } from "next-intl/server";

import { AccountDeletedEmail } from "@/features/account/emails/account-deleted-email";
import { cleanupBillingForOrganization } from "@/features/billing/services/cleanup-billing.service";
import { AUDIT_ACTION } from "@/features/organizations/constants/audit-actions.constant";
import { logEvent } from "@/features/organizations/services/audit-log.service";

import { env } from "@/lib/env";
import { Prisma, UserRole } from "@/lib/generated/prisma/client";
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

  // Snapshot the user's memberships up front for post-deletion auditing.
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

  // Critical section: the last-admin guard, sole-owner classification, and the
  // deletes all run in ONE Serializable transaction. Recounting inside the
  // transaction (never on stale reads) closes two races:
  //  - two of the last admins deleting concurrently, both passing the guard and
  //    leaving zero platform admins;
  //  - two co-owners deleting concurrently, both classifying the org as
  //    non-sole-owned and skipping the Stripe cancellation, orphaning billing.
  // External side effects (Stripe, Redis, R2, email) run AFTER commit.
  const soleOwnedOrgs = await prisma.$transaction(
    async (tx) => {
      if (user.role === UserRole.ADMIN) {
        const adminCount = await tx.user.count({
          where: {
            role: UserRole.ADMIN,
          },
        });

        if (adminCount <= 1) {
          throw new ForbiddenError("errors.account.onlyAdminCannotDelete");
        }
      }

      const ownedOrgIds = userMemberships
        .filter((membership) => membership.role === "owner")
        .map((membership) => membership.organizationId);

      const soleOwnedOrgIds: string[] = [];

      for (const orgId of ownedOrgIds) {
        const [ownerCount, memberCount] = await Promise.all([
          tx.member.count({
            where: {
              organizationId: orgId,
              role: "owner",
            },
          }),
          tx.member.count({
            where: {
              organizationId: orgId,
            },
          }),
        ]);

        if (ownerCount > 1) {
          continue;
        }

        // Sole owner. Deleting the account would cascade-delete the whole org.
        // Refuse when other members would be silently locked out — they must be
        // handed the org via transfer-ownership first.
        if (memberCount > 1) {
          throw new BadRequestError(
            "errors.account.mustTransferOwnershipFirst",
          );
        }

        soleOwnedOrgIds.push(orgId);
      }

      const orgsToDelete =
        soleOwnedOrgIds.length > 0
          ? await tx.organization.findMany({
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
            })
          : [];

      // Delete the user (cascades sessions, accounts, member rows), then the
      // sole-owned orgs (their remaining rows already gone via the user cascade).
      await tx.user.delete({
        where: {
          id: user.id,
        },
      });

      for (const org of orgsToDelete) {
        await tx.organization.delete({
          where: {
            id: org.id,
          },
        });
      }

      return orgsToDelete;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  // Audit account deletion (best-effort, after commit so blocked deletions are
  // never logged). AuditLog has no FK to user/org, so rows survive the deletes.
  for (const membership of userMemberships) {
    await logEvent({
      organizationId: membership.organizationId,
      userId: input.userId,
      action: AUDIT_ACTION.ACCOUNT_DELETED,
      entityType: "user",
      entityId: input.userId,
    });
  }

  // Cancel Stripe subscriptions and clear Redis for the deleted sole-owned orgs.
  for (const org of soleOwnedOrgs) {
    if (org.stripeCustomer) {
      await cleanupBillingForOrganization(
        org.stripeCustomer.stripeCustomerId,
        org.id,
      );
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
