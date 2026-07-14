---
paths:
  - "src/features/*/services/**"
---

# Security Rules — IDOR Prevention & Authorization

## Core Principles

### 1. NEVER Use Booleans for Permissions

```tsx
// ✅ CORRECT: type-safe
import { UserRole } from "@/lib/generated/prisma/client";

async function getEntities(userId: string, userRole: UserRole) {}

// ❌ WRONG: not extensible, not type-safe
async function getEntities(userId: string, isAdmin: boolean = false) {}
```

### 2. Separate Services Per Role — NEVER Mix

Admin and customer logic MUST live in separate services. No conditional branching on role inside a service.

```tsx
// ✅ CORRECT: two simple services
// src/features/projects/services/get-project.service.ts → customer
async function getProject(input: { userId: string; projectId: string }) {
  where: {
    id: input.projectId,
    userId: input.userId
  }
}

// src/features/users/services/get-user-project.service.ts → admin
async function getUserProject(input: { projectId: string }) {
  where: {
    id: input.projectId
  }
}

// ❌ WRONG: mixed logic with role conditionals
async function getProject(userId: string, userRole: UserRole, projectId: string) {
  const isAdmin = userRole === UserRole.ADMIN;

  where: {
    id: projectId, ...(!isAdmin && {
      userId
    })
  }
}
```

## Service Patterns

### Pattern 1: Public (No Auth)

For contact forms, pricing pages, public content. No `userId` parameter.

```tsx
import "server-only";

async function createContact(input: CreateContactInput): Promise<void> {
  await sendEmail({ ... });
}
```

### Pattern 2: Customer — User-Scoped Data

For data owned by a specific user. ALWAYS filter by `userId`.

```tsx
import "server-only";

import { PAGE_SIZE } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

import { NotFoundError } from "@/utils/errors/errors";

type GetProjectInput = {
  userId: string;
  projectId: string;
};

async function getProject(input: GetProjectInput): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: {
      id: input.projectId,
      userId: input.userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!project) {
    throw new NotFoundError("Projet introuvable");
  }

  return project;
}
```

### Pattern 3: Admin-Only Data

For user management, global analytics. Auth guaranteed by entry point (`adminActionClient` / `requireAdmin()`).

```tsx
import "server-only";

import { PAGE_SIZE } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

async function getUsers(filters: GetUsersFilters): Promise<GetUsersResult> {
  const whereClause = {
    ...(filters.search && {
      OR: [
        {
          name: {
            contains: filters.search,
            mode: "insensitive" as const,
          },
        },
        {
          email: {
            contains: filters.search,
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        [filters.sortBy]: filters.order,
      },
      skip: (filters.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.user.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: filters.page,
  };
}
```

## Subscription & Checkout Security

### Checkout Price Validation

The checkout service validates `priceId` against `ALLOWED_PRICE_IDS` (derived from `PLAN_CONFIG`). This is a **server-side allowlist** — only price IDs explicitly declared in `PLAN_CONFIG` can be used to create a checkout session.

- NEVER accept arbitrary price IDs from client input without allowlist check
- NEVER hardcode price ID checks — always use `ALLOWED_PRICE_IDS.includes()`
- NEVER bypass the allowlist for "testing" — add the plan to `PLAN_CONFIG` instead

### Subscription Access Guards

Use `requireCustomerPlan()` from `src/features/billing/guards/require-customer-plan.ts` to gate pages by subscription:

```tsx
// Any paid plan
await requireCustomerPlan();

// Specific plan(s) — typesafe PlanKey
await requireCustomerPlan("pro");
await requireCustomerPlan("business", "enterprise");
```

- NEVER check subscription status manually in pages — use the guard
- NEVER pass raw price ID strings — use `PlanKey` for type safety
- Plan upgrades/downgrades go through Stripe Customer Portal, not new checkouts

### Gate WRITES, not only the page (P0 — CRITICAL)

`requireCustomerPlan()` redirects and is **page-only**. A page guard alone is bypassable: server actions are directly-invocable POST endpoints, so a plan-gated feature whose page is guarded but whose mutations are not can be exercised by any org member on the free plan.

Every mutation (action/service) that backs a plan-gated feature MUST re-check the plan on the WRITE path with `requireOrganizationPlan()` from `src/features/billing/guards/require-organization-plan.ts` (throws `ForbiddenError("errors.billing.planRequired")` — the action-side counterpart to the page-only `requireCustomerPlan`).

```tsx
// src/features/projects/actions/create-project.action.ts
const createProjectAction = orgActionClient
  .inputSchema(CreateProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    await requireOrganizationPlan(ctx.organizationId, "pro"); // ← WRITE gate

    const project = await createProject({ ... });
    // ...
  });
```

- Pass the SAME `PlanKey`(s) the page uses, so read and write gate on the same entitlement.
- The gate belongs at the entry point (action), mirroring the rate-limit rule — NEVER only on the read page.
- `orgActionClient` verifies membership + active org, NOT the plan. Membership ≠ entitlement.

## Rate Limiting (Entry Points Only)

| Entry Point | Pattern                                                                   | Identifier        |
| ----------- | ------------------------------------------------------------------------- | ----------------- |
| Page route  | `filterRatelimit.limit(userId)` → `return <TooManyRequestsPage />`        | `session.user.id` |
| Action      | `.use(async ({ next }) => { await checkRatelimit(...); return next(); })` | `ctx.userId`      |
| API route   | `await checkRatelimit(...)` at top of handler                             | `session.user.id` |
| **Service** | **Nothing** — services are pure                                           | —                 |

## Service Checklist

Every service MUST have:

- `import "server-only"` at top
- Customer services: `userId: string` parameter + filter by `userId` in `where` clause
- Admin services: no `userId` filter (access guaranteed by entry point)
- Explicit `select` in Prisma queries
- `take` limit on `findMany`
- `$transaction` for parallel count + findMany

Every service MUST NOT have:

- Rate limiting (belongs at entry point)
- Re-validation of filter params (nuqs parsers already validate)
- Mixed admin/customer logic in the same service

## Anti-Patterns

```tsx
// ❌ Boolean permissions
async function getEntities(userId: string, isAdmin: boolean = false) {}

// ❌ Missing userId on customer service — IDOR vulnerability
async function getEntities(filters: GetEntitiesFilters) {
  await prisma.entity.findMany({
    where: {
      name: filters.search,
    },
  });
}

// ❌ Mixed role logic in one service
if (userRole === UserRole.ADMIN) {
  /* all data */
} else {
  /* user data */
}

// ❌ String instead of UserRole
async function getEntities(userId: string, role: string) {}

// ❌ Rate limiting inside service
async function getEntities(userId: string) {
  await checkRatelimit(filterRatelimit, userId); // belongs at entry point
}
```
