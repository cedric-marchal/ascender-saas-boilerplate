/**
 * Prisma seed orchestrator.
 *
 * Each domain has its own file in `prisma/seed/`:
 *   - auth.seed.ts          → Users, Accounts, Sessions
 *   - organization.seed.ts  → Organizations, Members
 *   - billing.seed.ts       → StripeCustomers, Subscriptions
 *   - verification.seed.ts  → Verifications
 *
 * To add a new domain:  create `prisma/seed/{domain}.seed.ts`,
 * export clean/seed functions, and register them below.
 *
 * To remove a domain (e.g. billing): delete the import and
 * remove the entry from SEEDERS.
 */

import { cleanAuth, seedAuth } from "./seed/auth.seed";
import { cleanBilling, seedBilling } from "./seed/billing.seed";
import { prisma } from "./seed/client";
import { SEED_PASSWORD } from "./seed/helpers";
import {
  cleanOrganizations,
  seedOrganizations,
} from "./seed/organization.seed";
import {
  cleanVerifications,
  seedVerifications,
} from "./seed/verification.seed";

// ---------------------------------------------------------------------------
// Seeder registry — order matters (FK dependencies)
// ---------------------------------------------------------------------------

type Seeder = {
  name: string;
  clean: () => Promise<void>;
  run: () => Promise<void>;
};

const SEEDERS: Seeder[] = [
  {
    name: "Auth (users, accounts, sessions)",
    clean: () => cleanAuth(prisma),
    run: () => seedAuth(prisma),
  },
  {
    name: "Organizations (organizations, members)",
    clean: () => cleanOrganizations(prisma),
    run: () => seedOrganizations(prisma),
  },
  {
    name: "Billing (stripe customers, subscriptions)",
    clean: () => cleanBilling(prisma),
    run: () => seedBilling(prisma),
  },
  {
    name: "Verifications",
    clean: () => cleanVerifications(prisma),
    run: () => seedVerifications(prisma),
  },
];

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log("🌱 Seeding database...\n");

  // Clean in reverse order (children before parents)
  console.log("🧹 Cleaning existing seed data...");
  for (const seeder of [...SEEDERS].reverse()) {
    await seeder.clean();
  }

  // Seed in declared order (parents before children)
  for (const seeder of SEEDERS) {
    console.log(`   → ${seeder.name}`);
    await seeder.run();
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Credential password: ${SEED_PASSWORD}\n`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
