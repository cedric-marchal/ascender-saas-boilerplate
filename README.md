# Next SaaS Boilerplate

A production-grade, multi-tenant SaaS starter for Next.js — organizations, seat-based Stripe billing, an admin panel, and an audit trail, built on strict conventions so a team can ship a real product instead of re-wiring auth and billing for the tenth time.

This is not a marketing-page template. It is an opinionated engineering foundation: server-first, type-safe end to end, secure by default (IDOR-safe services, org-membership enforcement, entry-point rate limiting), and covered by 560+ tests.

## What's inside

- **Auth** — Better Auth: email/password + Google OAuth, email verification, password reset.
- **Multi-tenant organizations** — orgs, memberships, roles, invitations (accept/revoke), ownership transfer, seat caps enforced against the active plan.
- **Billing** — Stripe Checkout + Customer Portal, org-level subscriptions, webhook handling with Redis-backed idempotency (`stripe:event:{eventId}`).
- **Admin panel** — separate admin services/pages (users, organizations, settings) with no customer-logic mixing, gated by role.
- **Audit log** — org-scoped `AuditLog` model + service, surfaced at `/dashboard/organisation/audit`.
- **Transactional emails** — React Email templates sent via Resend (invitations, verification, security notices).
- **File uploads** — Cloudflare R2 (S3-compatible), presigned URLs, used today for avatar uploads.
- **Rate limiting** — Upstash Redis + `@upstash/ratelimit`, enforced at entry points only (pages/actions/API routes — never inside services).
- **GDPR cookie consent** — `src/features/cookie-consent`, plus a full set of legal pages (terms, privacy policy, cookie policy, legal notice).
- **Reference domain** — `src/features/projects` is a complete, working CRUD slice (schemas, org-scoped services, actions, table UI with filters/pagination, tests including a cross-org IDOR proof) meant to be copied for your own domains.
- **560+ tests** (Vitest) and a 4-stage CI pipeline (lint, typecheck, test, build) on every push/PR to `main`.

## Stack

| Layer      | Tech                                    |
| ---------- | --------------------------------------- |
| Framework  | Next.js 16.1 (App Router, Turbopack)    |
| Language   | TypeScript 5.9 (strict)                 |
| Styling    | Tailwind CSS 4.3 + Shadcn/ui (Radix)    |
| DB         | Prisma 7.8 + Neon (serverless Postgres) |
| Auth       | Better Auth 1.6                         |
| Payments   | Stripe (`stripe` 20.4)                  |
| URL state  | Nuqs 2.9                                |
| Validation | Zod 4.4                                 |
| Forms      | TanStack Form 1.33                      |
| Tables     | TanStack Table 8.21                     |
| Actions    | next-safe-action 8.5                    |
| Emails     | React Email 6.6 + Resend                |
| HTTP       | up-fetch                                |
| Rate limit | Upstash Redis + Ratelimit 2.0           |
| Uploads    | Cloudflare R2 (`@aws-sdk/client-s3`)    |
| Hosting    | Vercel                                  |
| Tests      | Vitest 4.1                              |

Runtime: Node.js 22 (matches CI), pnpm (via `pnpm/action-setup@v4`, version 10).

## Quickstart

### 1. Install

```bash
pnpm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`. Every variable is validated at boot by `src/lib/env.ts` (`@t3-oss/env-nextjs` + Zod) — the app refuses to start with a missing or malformed value. You need real values for:

| Variable                                                                                                       | Where to get it                                                |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                                                                                           | Any 32-character random string (`openssl rand -hex 16`)        |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                                                    | Google Cloud Console OAuth client                              |
| `DATABASE_URL`                                                                                                 | A Neon Postgres connection string                              |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`                                                          | Upstash Redis REST credentials                                 |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `NEXT_PUBLIC_R2_PUBLIC_URL` | Cloudflare R2 bucket + API token                               |
| `RESEND_API_KEY` / `RESEND_EMAIL_NOREPLY` / `RESEND_EMAIL_CONTACT` / `RESEND_EMAIL_SECURITY`                   | Resend account + verified sending domains                      |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_PRO`                                          | Stripe dashboard (test mode is fine) + a "Pro" recurring Price |

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE`, `MAINTENANCE_ENABLED`, and `NEXT_TELEMETRY_DISABLED` already have sane local defaults in `.env.example`.

### 3. Push the schema and seed the database

```bash
pnpm db:push
pnpm db:seed
```

Seeding is idempotent (it cleans its own `seed-*` rows first) and prints the shared password on completion. Every seeded account uses:

- **Password**: `SeedPassword42!`
- **A ready-to-use account**: `cedric@next.dev` (plus a realistic pool of other seeded users, two demo organizations, memberships across every role, subscriptions, and — for the reference domain — seeded projects on one org and an intentionally empty org to exercise the empty state)

### 4. (Optional) Forward Stripe webhooks locally

```bash
pnpm stripe:listen
```

Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET` if it differs from what's already in `.env`.

### 5. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with the seeded account above, and open `/dashboard/projets` to see the reference CRUD domain.

## Scripts

| Script                                                 | Purpose                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `pnpm dev`                                             | Start the dev server (Turbopack)                                                            |
| `pnpm build`                                           | `prisma generate` + production build                                                        |
| `pnpm start`                                           | Start the production server                                                                 |
| `pnpm lint`                                            | ESLint                                                                                      |
| `pnpm typecheck`                                       | `tsc --noEmit`                                                                              |
| `pnpm format`                                          | Prettier (write)                                                                            |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest                                                                                      |
| `pnpm check:unused`                                    | Knip (unused files/exports/deps)                                                            |
| `pnpm db:push`                                         | Push the Prisma schema to the database (no migration history — this repo is `db:push`-only) |
| `pnpm db:migrate`                                      | `prisma migrate dev` (available, unused by the default workflow)                            |
| `pnpm db:seed`                                         | Run `prisma/seed.ts`                                                                        |
| `pnpm db:studio`                                       | Open Prisma Studio                                                                          |
| `pnpm email:dev`                                       | Preview React Email templates                                                               |
| `pnpm stripe:listen`                                   | Forward Stripe webhooks to `localhost:3000/api/stripe/webhooks`                             |
| `pnpm analyze`                                         | `next experimental-analyze`                                                                 |

## Architecture

```
src/app/                      # Routes only (thin shims — no business logic)
├── (public)/                 # Marketing, auth, legal pages
├── (protected)/              # Dashboard + Admin (guarded)
└── api/                      # API route handlers (auth, avatar, Stripe webhooks)

src/features/                 # ALL business logic, one folder per domain
├── {feature}/
│   ├── actions/               # Server Actions (next-safe-action)
│   ├── components/            # UI (forms/, modals/ subdirs)
│   ├── constants/             # Domain constants, Nuqs searchParams, SEO
│   ├── emails/                # React Email templates
│   ├── pages/                 # Feature page + loading component
│   ├── schemas/                # Zod validation
│   └── services/               # Server-only logic (security-scoped)

src/lib/                      # Shared infrastructure (auth, prisma, redis, env, r2)
src/components/               # Shared UI (ui/, pages/, public/, protected/)
src/utils/                    # Pure utilities (errors/, date/, string/)
src/hooks/                    # Shared hooks
```

Everything derives from one source-of-truth chain:

```
Prisma schema (enums ALWAYS UPPERCASE)
  → src/lib/generated/prisma/client (server) or prisma/browser (client-safe)
  → src/lib/parsers/filters.ts + src/lib/parsers/nuqs.ts
  → src/features/*/constants/ → schemas/ → services/ → actions/ → components/
  → src/app/*/page.tsx
```

`src/features/projects` is the reference implementation of every convention below — copy it as the starting point for a new domain. See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** for the full write-up (feature anatomy, security model, error handling, caching strategy). The authoritative, machine-enforced rules live in `.claude/rules/*.md` and are loaded automatically by Claude Code based on the file being edited.

## Testing

```bash
pnpm test          # 560+ tests, Vitest
pnpm test:coverage # with coverage report
```

Tests are colocated under `__tests__/` and mirror the `src/features/` tree. The reference domain (`__tests__/features/projects/`) includes a service-level cross-org isolation test proving IDOR safety — the pattern to follow for any new domain.

CI (`.github/workflows/ci.yml`) runs four jobs on every push/PR to `main`: **lint**, **typecheck**, **test**, then **build** (gated on the first three passing), using placeholder env values for the build step.

## Deployment

Designed for:

- **Hosting**: Vercel
- **Database**: Neon (serverless Postgres, works natively with Vercel's edge/serverless functions via `@neondatabase/serverless` + `@prisma/adapter-neon`)
- **Rate limiting / cache**: Upstash Redis (REST API, no persistent connection needed)
- **Transactional email**: Resend
- **File storage**: Cloudflare R2 (S3-compatible, no egress fees)

Set every variable from the quickstart table above (with production values) in your hosting provider's environment configuration, then run `pnpm db:push` against the production database before your first deploy (or `pnpm db:migrate deploy` if you've since adopted migration history).

## Known limitations

- **French-only UI today.** All user-facing strings, Zod messages, and emails are in French; the convention is documented in `.claude/CLAUDE.md`. An English/French i18n retrofit (next-intl, locale routing, string extraction) is planned — see `aidd_docs/tasks/2026_07/2026_07_05-audit-boilerplate-yc-part-2.md`.
- **Single "Pro" plan.** Billing supports exactly one paid plan (`PLAN_CONFIG` in `src/features/billing/constants/plan.constant.ts`) with seat caps; adding tiers is a config change, not a rewrite, but multi-tier pricing isn't wired up yet.
- **No observability/analytics layer.** No error tracking, product analytics, or APM is integrated out of the box.
- **No migration history.** The schema is applied via `pnpm db:push`; adopt `prisma migrate` before you have a production database you can't reset.
- **No AI scaffolding yet.** An opt-in, plan-gated AI chat slice is planned — see `aidd_docs/tasks/2026_07/2026_07_05-audit-boilerplate-yc-part-6.md`.

The full audit this roadmap comes from is in `aidd_docs/tasks/2026_07/2026_07_05-audit-boilerplate-yc-master.md`.
