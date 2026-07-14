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
import type { PrismaClient } from "../../src/lib/generated/prisma/client";
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

| Helper                                              | Usage                                                  |
| --------------------------------------------------- | ------------------------------------------------------ |
| `seedId(prefix, index)`                             | `seed-{prefix}-{index padded to 3}`                    |
| `SEED_FILTER`                                       | `{ where: { id: { startsWith: "seed-" } } }`           |
| `getHashedPassword()`                               | Returns Better Auth scrypt hash                        |
| `SEED_PASSWORD`                                     | The raw password string                                |
| `generateSlug(name, index)`                         | Deterministic slug for users                           |
| `slugify(text)`                                     | Slug helper (matches app's `src/utils/string/slugify`) |
| `daysAgo(n)` / `daysFromNow(n)` / `hoursFromNow(n)` | Date helpers                                           |

## Production-Accurate Formats (P0)

Seed data MUST match the exact formats that modules generate in production. Refer to this table when creating or updating seeds.

### Better Auth (Users, Accounts, Sessions, Verifications)

Better Auth generates all IDs via `crypto.randomUUID()` (UUID v4). Seed IDs use the `seed-` prefix instead — this is intentional for cleanup. But all other fields MUST match production format.

| Field                                    | Production format                              | Seed convention                               |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `user.id`                                | UUID v4                                        | `seedId("user", index)`                       |
| `account.id`                             | UUID v4                                        | `seedId("account", index)`                    |
| `account.accountId` (credential)         | = `userId`                                     | `seedId("user", index)`                       |
| `account.accountId` (Google)             | Google `sub` claim (numeric string, ~21 chars) | Realistic numeric string                      |
| `account.providerId`                     | `"credential"` or `"google"`                   | Same                                          |
| `account.scope` (Google)                 | `"openid email profile"`                       | Same                                          |
| `account.accessTokenExpiresAt` (Google)  | ~1h from auth                                  | `hoursFromNow(1)`                             |
| `account.refreshTokenExpiresAt` (Google) | `null` (never expires)                         | `null`                                        |
| `account.password` (credential)          | scrypt hash via Better Auth                    | `getHashedPassword()`                         |
| `account.password` (Google)              | `null`                                         | `null`                                        |
| `session.id`                             | UUID v4                                        | `seedId("session", index)`                    |
| `session.token`                          | Opaque random string                           | `seed-session-token-{index}`                  |
| `session.ipAddress`                      | IPv4 or IPv6 or `null`                         | Vary: IPv4, IPv6, and null                    |
| `session.userAgent`                      | Varies per browser/device or `null`            | Vary across records — NEVER identical for all |
| `verification.id`                        | UUID v4                                        | `seedId("verification", index)`               |
| `verification.value`                     | Opaque token string                            | `seed-*-token-{index}`                        |

### Stripe (StripeCustomer, Subscription)

| Field                               | Production format                 | Seed convention                |
| ----------------------------------- | --------------------------------- | ------------------------------ |
| `stripeCustomer.id`                 | cuid (Prisma default)             | `seed-stripe-customer-{index}` |
| `stripeCustomer.stripeCustomerId`   | `cus_` + 14-24 alphanumeric       | `cus_seed_` + slugified name   |
| `subscription.id`                   | cuid (Prisma default)             | `seed-subscription-{index}`    |
| `subscription.stripeSubscriptionId` | `sub_` + 14-24 alphanumeric       | `sub_seed_` + descriptive      |
| `subscription.stripePriceId`        | `price_` + 14-24 alphanumeric     | `price_seed_pro_monthly`       |
| `subscription.status`               | All 8 `SubscriptionStatus` values | MUST cover all statuses        |

## Edge Case Coverage (P0 — CRITICAL)

Seed data MUST cover **every possible state and edge case** as if it were a production database. The goal is to stress-test the UI and catch overflow, truncation, and layout issues during development — not just happy paths.

### State coverage

Every boolean, enum, and nullable field MUST have at least one seed record per possible value:

- `emailVerified`: true AND false
- `role`: one user per `UserRole` value (ADMIN, CUSTOMER)
- `image`: with avatar AND null (test fallback initials)
- `SubscriptionStatus`: at least one subscription per status (ACTIVE, TRIALING, CANCELED, PAST_DUE, etc.)
- `cancelAtPeriodEnd`: true AND false
- Nullable fields (`ipAddress`, `userAgent`): present AND null

### Boundary lengths & distribution

Extremes are more valuable than averages for demos and UI testing. When generating bulk seed data, distribute string lengths as **~1/3 short, ~1/3 normal, ~1/3 long** — NOT mostly normal with a few edge cases. Use separate name pools per length category (short, normal, long) and rotate between them deterministically.

Include at least one record at each **extreme** (minimum and maximum realistic length):

| Field       | Min seed                 | Max seed                                                                      |
| ----------- | ------------------------ | ----------------------------------------------------------------------------- |
| `name`      | `"A B"` (3 chars)        | `"Jean-Baptiste de La Rochefoucauld-Montmorency"` (45+ chars)                 |
| `email`     | `"a@b.fr"` (6 chars)     | `"jean-baptiste.rochefoucauld-montmorency@entreprise-exemple.fr"` (60+ chars) |
| `slug`      | Short slug from min name | Long slug auto-generated from long name                                       |
| `userAgent` | `null`                   | Full realistic UA string (150+ chars)                                         |
| `ipAddress` | `null`                   | Full IPv6 `"2001:0db8:85a3:0000:0000:8a2e:0370:7334"`                         |

### Temporal edge cases

- Expired sessions (`expiresAt` in the past)
- Expired verifications (`expiresAt` in the past)
- Subscriptions at period boundaries (`currentPeriodEnd` = today)
- Recently created records AND old records (vary `createdAt`)

### Why

If a long name breaks the sidebar or a null image crashes the avatar, you want to catch it in dev — not in production. Seed data is your first line of defense against UI edge cases.

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

Seed files are excluded from `no-restricted-imports` and `no-console` rules in `eslint.config.mjs`. Relative imports (`../../src/lib/generated/prisma/client`) are allowed because seed files run outside Next.js with `tsx`.

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
Only short/happy-path seed data (must include max-length strings, all enum values, all nullable states)
Missing boundary-length records (long names, long emails — these catch UI overflow bugs)
```
