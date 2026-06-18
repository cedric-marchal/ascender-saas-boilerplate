import type { PrismaClient } from "../../lib/generated/prisma/client";
import { USERS, type UserSeed } from "./auth.seed";
import { SEED_FILTER, seedId, slugify } from "./helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrganizationSeed = {
  userIndex: number;
  name: string;
  plan: string;
  seatsUsed: number;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function orgIdForUser(userIndex: number): string {
  return seedId("org", userIndex);
}

function orgSlugForUser(name: string, userIndex: number): string {
  return `${slugify(name) || "organisation"}-org-${userIndex}`;
}

function memberIdForUser(userIndex: number): string {
  return seedId("member", userIndex);
}

// ---------------------------------------------------------------------------
// Data — one personal org per customer user
// ---------------------------------------------------------------------------

const CUSTOMER_USERS: UserSeed[] = USERS.filter(
  (user: UserSeed) => user.role === "CUSTOMER",
);

function buildOrganizationSeeds(): OrganizationSeed[] {
  return CUSTOMER_USERS.map((user: UserSeed): OrganizationSeed => {
    // Users with stripe customers get "pro" plan
    const plan = user.hasStripeCustomer ? "pro" : "free";

    return {
      userIndex: user.index,
      name: `${user.name} (org)`,
      plan,
      seatsUsed: 1,
      createdAt: user.createdAt,
    };
  });
}

const ORGANIZATIONS: OrganizationSeed[] = buildOrganizationSeeds();

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedOrganizations(prisma: PrismaClient): Promise<void> {
  for (const org of ORGANIZATIONS) {
    const user = USERS.find((entry: UserSeed) => entry.index === org.userIndex);

    if (!user) {
      throw new Error(`No user found for index ${org.userIndex}`);
    }

    await prisma.organization.create({
      data: {
        id: orgIdForUser(org.userIndex),
        name: org.name,
        slug: orgSlugForUser(user.name, org.userIndex),
        plan: org.plan,
        seatsUsed: org.seatsUsed,
        createdAt: org.createdAt,
        updatedAt: org.createdAt,
        members: {
          create: {
            id: memberIdForUser(org.userIndex),
            userId: seedId("user", org.userIndex),
            role: "owner",
            createdAt: org.createdAt,
          },
        },
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Clean (children first for FK safety)
// ---------------------------------------------------------------------------

async function cleanOrganizations(prisma: PrismaClient): Promise<void> {
  await prisma.member.deleteMany(SEED_FILTER);
  await prisma.invitation.deleteMany(SEED_FILTER);
  await prisma.organization.deleteMany(SEED_FILTER);
}

export {
  cleanOrganizations,
  orgIdForUser,
  ORGANIZATIONS,
  seedOrganizations,
  type OrganizationSeed,
};
