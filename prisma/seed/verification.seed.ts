import type { PrismaClient } from "../../lib/generated/prisma/client";
import { USERS, type UserSeed } from "./auth.seed";
import { daysAgo, hoursFromNow, SEED_FILTER, seedId } from "./helpers";

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedVerifications(prisma: PrismaClient): Promise<void> {
  const unverifiedUsers = USERS.filter((user: UserSeed) => !user.emailVerified);

  // Pending verification for each unverified user
  for (const [index, user] of unverifiedUsers.entries()) {
    await prisma.verification.create({
      data: {
        id: seedId("verification", index + 1),
        identifier: user.email,
        value: `seed-email-verification-token-${user.index}`,
        expiresAt: hoursFromNow(24 - index * 12),
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      },
    });
  }

  // Expired verification (cleanup target for cron)
  await prisma.verification.create({
    data: {
      id: seedId("verification", 99),
      identifier: "expired-test@example.com",
      value: "seed-expired-verification-token",
      expiresAt: daysAgo(3),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
  });
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

async function cleanVerifications(prisma: PrismaClient): Promise<void> {
  await prisma.verification.deleteMany(SEED_FILTER);
}

export { cleanVerifications, seedVerifications };
