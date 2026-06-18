import type { PrismaClient } from "../../lib/generated/prisma/client";
import { USERS, type UserSeed } from "./auth.seed";
import { daysAgo, SEED_FILTER, seedId, slugify } from "./helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrganizationSeed = {
  userIndex: number;
  name: string;
  plan: string;
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
      createdAt: user.createdAt,
    };
  });
}

const ORGANIZATIONS: OrganizationSeed[] = buildOrganizationSeeds();

// ---------------------------------------------------------------------------
// Demo multi-member orgs for isolation tests
// Org A: owner = user 3 (Thomas Lefèvre), extra members: user 4, user 5
// Org B: owner = user 6 (Camille Roux), extra members: user 7
// ---------------------------------------------------------------------------

const DEMO_ORG_A_ID = "seed-demo-org-a";
const DEMO_ORG_B_ID = "seed-demo-org-b";

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedOrganizations(prisma: PrismaClient): Promise<void> {
  // Personal orgs (one per customer user)
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

  // Demo org A — multi-member org for isolation tests
  await prisma.organization.create({
    data: {
      id: DEMO_ORG_A_ID,
      name: "Démo Organisation A",
      slug: "demo-organisation-a",
      plan: "pro",
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
      members: {
        create: [
          {
            id: "seed-demo-member-a-1",
            userId: seedId("user", 3),
            role: "owner",
            createdAt: daysAgo(60),
          },
          {
            id: "seed-demo-member-a-2",
            userId: seedId("user", 4),
            role: "admin",
            createdAt: daysAgo(55),
          },
          {
            id: "seed-demo-member-a-3",
            userId: seedId("user", 5),
            role: "member",
            createdAt: daysAgo(50),
          },
        ],
      },
    },
  });

  // Demo org B — separate org for cross-org isolation tests
  await prisma.organization.create({
    data: {
      id: DEMO_ORG_B_ID,
      name: "Démo Organisation B",
      slug: "demo-organisation-b",
      plan: "free",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
      members: {
        create: [
          {
            id: "seed-demo-member-b-1",
            userId: seedId("user", 6),
            role: "owner",
            createdAt: daysAgo(45),
          },
          {
            id: "seed-demo-member-b-2",
            userId: seedId("user", 7),
            role: "member",
            createdAt: daysAgo(40),
          },
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Clean (children first for FK safety)
// ---------------------------------------------------------------------------

async function cleanOrganizations(prisma: PrismaClient): Promise<void> {
  await prisma.member.deleteMany(SEED_FILTER);
  await prisma.member.deleteMany({
    where: {
      id: {
        in: [
          "seed-demo-member-a-1",
          "seed-demo-member-a-2",
          "seed-demo-member-a-3",
          "seed-demo-member-b-1",
          "seed-demo-member-b-2",
        ],
      },
    },
  });
  await prisma.invitation.deleteMany(SEED_FILTER);
  await prisma.organization.deleteMany(SEED_FILTER);
  await prisma.organization.deleteMany({
    where: {
      id: {
        in: [DEMO_ORG_A_ID, DEMO_ORG_B_ID],
      },
    },
  });
}

export {
  cleanOrganizations,
  DEMO_ORG_A_ID,
  DEMO_ORG_B_ID,
  orgIdForUser,
  ORGANIZATIONS,
  seedOrganizations,
  type OrganizationSeed,
};
