---
paths:
  - "prisma/seed.ts"
  - "prisma/seed/**"
---

# Seed Rules

## Context

Rules for the Prisma seed script (`prisma/seed.ts`) and domain seed files (`prisma/seed/`).

## Architecture (P0)

```
prisma/
├── seed.ts                    # Orchestrator — imports seeders, runs clean/seed
└── seed/
    ├── client.ts              # PrismaClient + production guard + env check
    ├── helpers.ts             # Shared: dates, IDs, slugify, password hashing
    ├── auth.seed.ts           # Users + Accounts + Sessions (core)
    ├── billing.seed.ts        # StripeCustomers + Subscriptions (feature)
    ├── verification.seed.ts   # Verifications (core)
    └── {domain}.seed.ts       # One file per domain
```

## Adding a New Seeder (P0)

1. Create `prisma/seed/{domain}.seed.ts`
2. Export `seed{Domain}(prisma: PrismaClient): Promise<void>` — creates records
3. Export `clean{Domain}(prisma: PrismaClient): Promise<void>` — deletes records
4. Register in `prisma/seed.ts` inside the `SEEDERS` array
5. Order in `SEEDERS` matters: parents before children (FK dependencies)

## Seeder File Structure (P0)

Each `{domain}.seed.ts` follows this layout:

```ts
import type { PrismaClient } from "../../lib/generated/prisma/client";
import { /* helpers */ } from "./helpers";

// Types
type {Entity}Seed = { ... };

// Data
const ITEMS: {Entity}Seed[] = [ ... ];

// Seed
async function seed{Domain}(prisma: PrismaClient): Promise<void> { ... }

// Clean (children first for FK safety)
async function clean{Domain}(prisma: PrismaClient): Promise<void> { ... }

export { clean{Domain}, seed{Domain} };
```

## Seed Data Conventions (P0)

| Rule              | Convention                                                            |
| ----------------- | --------------------------------------------------------------------- |
| **ID prefix**     | All seed IDs start with `seed-` (enables safe cleanup)                |
| **ID generation** | Use `seedId(prefix, index)` from helpers                              |
| **Cleanup**       | Use `SEED_FILTER` (`{ where: { id: { startsWith: "seed-" } } }`)      |
| **Clean order**   | Children before parents (reverse of creation)                         |
| **Seed order**    | Parents before children (respect FK constraints)                      |
| **Passwords**     | Hash via `getHashedPassword()` from helpers (Better Auth scrypt)      |
| **Slugs**         | Use `generateSlug(name, index)` from helpers                          |
| **Dates**         | Use `daysAgo()`, `daysFromNow()`, `hoursFromNow()` from helpers       |
| **Images**        | Use `https://picsum.photos/id/{id}/200/200` with known IDs (dev only) |
| **Stripe IDs**    | Prefix with `seed_` or `cus_seed_` — never use real Stripe IDs        |
| **Data realism**  | French names, real-looking emails, varied states and scenarios        |

## Orchestrator (`seed.ts`) Rules (P0)

- `seed.ts` is a thin orchestrator — NO data, NO Prisma calls
- Imports `prisma` from `./seed/client` and seeders from `./seed/*.seed.ts`
- Cleans in **reverse** `SEEDERS` order, seeds in **declared** order
- Each entry in `SEEDERS` has `name`, `clean`, and `run`

## Security (P0)

- `client.ts` MUST throw if `NODE_ENV === "production"`
- `client.ts` MUST throw if `DATABASE_URL` is missing
- NEVER use real Stripe/OAuth tokens — always prefix with `fake-seed-` or `seed-`
- NEVER log the password to stdout (reference the constant name instead)

## Shared Helpers (`helpers.ts`) (P0)

Available exports — use these, don't reinvent:

| Helper                                              | Usage                                              |
| --------------------------------------------------- | -------------------------------------------------- |
| `seedId(prefix, index)`                             | `seed-{prefix}-{index padded to 3}`                |
| `SEED_FILTER`                                       | `{ where: { id: { startsWith: "seed-" } } }`       |
| `getHashedPassword()`                               | Returns Better Auth scrypt hash                    |
| `SEED_PASSWORD`                                     | The raw password string                            |
| `generateSlug(name, index)`                         | Deterministic slug for users                       |
| `slugify(text)`                                     | Slug helper (matches app's `utils/string/slugify`) |
| `daysAgo(n)` / `daysFromNow(n)` / `hoursFromNow(n)` | Date helpers                                       |

## Single Source of Truth (P0 — CRITICAL)

All relational seed data MUST be driven from a single shared data array. NEVER duplicate IDs, emails, indexes, or flags across files.

**`USERS` in `auth.seed.ts` is the source of truth.** Other seeders import it and filter by flags — they NEVER maintain their own lists of user indexes or emails.

| Seeder       | Correct                                                   | Wrong                                         |
| ------------ | --------------------------------------------------------- | --------------------------------------------- |
| billing      | `USERS.filter(u => u.hasStripeCustomer)`                  | `const STRIPE_USER_INDEXES = [3, 4, 5, 6, 7]` |
| verification | `USERS.filter(u => !u.emailVerified)` → uses `user.email` | Hardcoded `"julien.petit@hotmail.fr"`         |

**Rules:**

- Flags that drive dependent seeders (`hasStripeCustomer`, `hasSession`, `emailVerified`) belong on `UserSeed`
- Dependent seeders MUST import `{ USERS, type UserSeed }` and filter on these flags
- If a subscription references a user, validate at seed time: throw if `hasStripeCustomer` is false
- If a verification references a user, derive `identifier` from `user.email` — never hardcode it

**Why:** Changing one email or flag in `USERS` must automatically propagate everywhere. Hardcoded duplicates cause silent FK failures and data drift.

## Cross-Domain Data Access (P0)

If a seeder needs data from another domain (e.g., billing needs user list):

- Export the data array and its type from the source seeder
- Import it in the dependent seeder
- Example: `billing.seed.ts` imports `{ USERS, type UserSeed }` from `auth.seed.ts`

## ESLint (P1)

Seed files are excluded from `no-restricted-imports` and `no-console` rules in `eslint.config.mjs`. Relative imports (`../../lib/generated/prisma/client`) are allowed because seed files run outside Next.js with `tsx`.

## Anti-Patterns

```
Data or Prisma calls directly in seed.ts (must be in domain seeders)
$transaction([...]) for deletes (doesn't guarantee order — use sequential awaits)
Non-deterministic IDs or tokens (Date.now(), crypto.randomUUID())
Real Stripe price IDs from env vars
Mixing multiple domains in one seed file
Missing clean function (every seeder must be idempotent)
Absolute @/ imports (won't resolve with tsx)
Hardcoded index lists like STRIPE_USER_INDEXES = [3, 4, 5] (use flags on USERS)
Hardcoded emails in verifications (derive from USERS.filter(u => !u.emailVerified))
Duplicating user data across seeders instead of importing from auth.seed.ts
```
