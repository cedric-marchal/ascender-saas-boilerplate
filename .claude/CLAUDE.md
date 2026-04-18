# Ascender SaaS Boilerplate

## Stack

| Layer      | Tech                         |
| ---------- | ---------------------------- |
| Framework  | Next.js 16 (App Router)      |
| Language   | TypeScript (strict)          |
| Styling    | Tailwind CSS 4 + Shadcn/ui   |
| DB         | Prisma 7 + Neon (PostgreSQL) |
| Auth       | Better Auth                  |
| Payments   | Stripe                       |
| URL State  | Nuqs                         |
| Validation | Zod 4                        |
| Forms      | TanStack Form                |
| Tables     | TanStack Table               |
| Actions    | next-safe-action             |
| Emails     | React Email + Resend         |
| HTTP       | up-fetch                     |
| Rate Limit | Upstash Redis + Ratelimit    |
| Hosting    | Vercel                       |
| Tests      | Vitest                       |

## Architecture

```
app/                          # Routes only (thin shims)
├── (public)/                 # Public pages
├── (protected)/              # Dashboard + Admin
└── api/                      # API route handlers

features/                     # ALL business logic
├── {feature}/
│   ├── actions/              # Server Actions (next-safe-action)
│   ├── components/           # UI (forms/, modals/ subdirs)
│   ├── constants/            # Domain constants + SEO schemas
│   ├── emails/               # React Email templates
│   ├── pages/                # Feature page + loading components
│   ├── schemas/              # Zod validation
│   └── services/             # Server-only logic

lib/                          # Shared infrastructure
components/                   # Shared UI (ui/, pages/, public/, protected/)
utils/                        # Pure utilities (errors/, date/, string/)
hooks/                        # Shared hooks
```

## Source of Truth Hierarchy

```
Prisma Schema (enums: UserRole, SubscriptionStatus — ALWAYS UPPERCASE)
  → lib/generated/prisma/client (server) or prisma/browser (client-safe)
  → lib/parsers/filters.ts (pure constants) + lib/parsers/nuqs.ts (Nuqs parsers only)
  → features/*/constants/
  → features/*/schemas/
  → features/*/services/
  → features/*/actions/
  → features/*/components/
  → app/*/page.tsx
```

## Workflow (CRITICAL)

BEFORE modifying any file, ALWAYS read at least 3 files:

1. **Similar files** — understand existing patterns and conventions
2. **Imported dependencies** — read implementations you're not 100% sure about

NEVER skip this step, even for small changes.

## Core Conventions

| Rule              | Convention                                                                    |
| ----------------- | ----------------------------------------------------------------------------- |
| **Imports**       | Absolute `@/`, combine types+values: `import { value, type Type } from "mod"` |
| **Exports**       | Named only (NEVER default)                                                    |
| **Naming**        | Full words (NEVER abbreviations: `event` not `e`, `index` not `i`)            |
| **Components**    | Server by default, `"use client"` only for hooks/events/browser APIs          |
| **Props**         | Inline if ≤2, separate `{Name}Props` type if >2 (use `type`, never interface) |
| **File naming**   | kebab-case.tsx                                                                |
| **Booleans**      | `is`, `has`, `can`, `should` prefixes                                         |
| **Strings**       | Template literals only, NEVER concatenation with `+`                          |
| **If braces**     | Always, even single-line                                                      |
| **Spacing**       | Blank line after `}` if code follows, blank line before final `return`        |
| **Callbacks**     | Always type params: `.map((item: Item) => ...)`                               |
| **Buttons**       | `type="button"` (except submit), `aria-hidden="true"` on decorative icons     |
| **Links**         | `<Link>` for internal routes, `<a>` for external URLs                         |
| **User messages** | French. Code/comments: English.                                               |

## Prisma

- Enums: ALL UPPERCASE. Map external APIs (Stripe lowercase) via constants.
- Server files (`services/`, `actions/`, `api/`): import from `@/lib/generated/prisma/client`
- Client-safe files (`constants/`, `components/`): import from `@/lib/generated/prisma/browser`
- ALWAYS `select` + `take` on `findMany`, `$transaction` for parallel count+findMany

## Security (CRITICAL)

- Services: ALWAYS `userId: string` parameter for user-scoped data (NEVER booleans for permissions)
- Customer services: ALWAYS filter by `userId` in Prisma `where` clause (IDOR prevention)
- Admin services: separate service, no `userId` filter (access guaranteed by entry point)
- NEVER mix admin and customer logic in the same service — separate services per role
- Rate limiting at entry point only (page/action/API), NEVER in services

## Error Handling

Classes in `@/utils/errors/errors` (400→429). Handlers:

- **Actions**: throw directly (no try/catch — next-safe-action handles it)
- **API routes**: `catch (error: unknown)` → `handleApiError(error)`
- **Components**: `getActionResult(await executeAsync(value))` in try/catch + `getErrorMessage`

## Anti-Patterns (NEVER)

```
default exports, relative imports, untyped callbacks/handlers
magic strings for enums, Record<string, ...> for domain enums
native fetch (use upfetch), react-hook-form (use TanStack Form)
findMany without select+take, abbreviations (e, evt, req, res, idx, i)
```

## Rule Files

Detailed rules are in `.claude/rules/` — loaded conditionally per file path:

- **Feature structure & naming**: `feature.md`
- **Server Actions**: `action.md`
- **API Routes**: `api.md`
- **Pages & Loading**: `page.md`
- **Forms**: `form.md`
- **Filters, Sort & Pagination**: `filter.md`
- **Security (IDOR)**: `security.md`
- **Code Style (spacing, strings, control flow)**: `code-style.md`

## Self-Check

Before finalizing, verify:

- Read at least 3 existing files before making changes?
- Code is consistent with existing project patterns?
- All conventions above followed?

If any answer is no, stop and fix it first.
