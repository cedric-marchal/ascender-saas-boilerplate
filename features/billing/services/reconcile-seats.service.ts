import "server-only";

import { routing } from "@/i18n/routing";

import { sendSeatLimitExceededEmail } from "@/features/billing/services/send-seat-limit-exceeded-email.service";
import { getSeatCapStatus } from "@/features/organizations/services/check-seat-capacity.service";

import { seatLimitExceededEmailCacheKey } from "@/lib/cache-keys";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function findOrganizationOwnerEmail(
  organizationId: string,
): Promise<string | null> {
  const ownerMember = await prisma.member.findFirst({
    where: {
      organizationId,
      role: "owner",
    },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return ownerMember?.user.email ?? null;
}

/**
 * Detects whether an organization is over its (new, smaller) seat cap after a
 * downgrade or cancellation, and notifies the owner if so.
 *
 * IMPORTANT — product decision (see plan risk register): this function NEVER
 * removes, deactivates, or mutates any membership row. Over-cap members keep
 * full access to the organization; the only consequence of being over cap is
 * that adding a NEW member is blocked (already enforced separately by
 * `checkSeatCapacity`). Auto-removing members on downgrade would be a
 * destructive surprise — flagging + notifying is the only allowed behavior.
 *
 * Deduped in Redis per organization + seat cap (not per subscription event):
 * repeated `customer.subscription.updated` events for the same downgraded
 * cap (e.g. Stripe retries, unrelated field changes while the price stays
 * the same) must not spam the owner. A further downgrade (a smaller cap
 * again) or the TTL lapsing will notify again, since the org's situation has
 * meaningfully changed or enough time has passed to warrant a reminder.
 */
async function reconcileSeatsOnDowngrade(
  organizationId: string,
): Promise<void> {
  const { memberCount, seatCap, isOverCap } =
    await getSeatCapStatus(organizationId);

  if (!isOverCap) {
    return;
  }

  const dedupeKey = seatLimitExceededEmailCacheKey(organizationId, seatCap);

  try {
    const alreadyNotified = await redis.get(dedupeKey);

    if (alreadyNotified) {
      return;
    }
  } catch (redisError: unknown) {
    logger.error("Redis seat-limit dedupe check failed", {
      organizationId,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
    // Redis unavailable → continue without dedupe (better than dropping the notice)
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const ownerEmail = await findOrganizationOwnerEmail(organizationId);

  if (!organization || !ownerEmail) {
    logger.warn(
      "Cannot send seat-limit-exceeded email: missing organization or owner",
      {
        organizationId,
      },
    );

    return;
  }

  await sendSeatLimitExceededEmail({
    email: ownerEmail,
    organizationName: organization.name,
    memberCount,
    seatCap,
    locale: routing.defaultLocale,
  });

  try {
    await redis.set(dedupeKey, 1, { ex: DEDUPE_TTL_SECONDS });
  } catch (redisError: unknown) {
    logger.error("Redis seat-limit dedupe set failed", {
      organizationId,
      error:
        redisError instanceof Error ? redisError.message : String(redisError),
    });
    // Non-fatal: dedupe key not set, a later retry may send a duplicate
    // notification — acceptable tradeoff, same as the payment-failed dunning path.
  }
}

export { reconcileSeatsOnDowngrade };
