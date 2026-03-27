---
paths:
  - "features/*/services/**"
---

# Security Rules — IDOR Prevention & Authorization

## Core Principles

### 1. NEVER Use Booleans for Permissions

```tsx
// ✅ CORRECT: extensible, type-safe
import { UserRole } from "@/lib/generated/prisma/client";

// ❌ WRONG: not extensible, not type-safe
async function getEntities(userId: string, isAdmin: boolean = false) {}

async function getEntities(userId: string, userRole: UserRole) {}
```

### 2. UNRESTRICTED_ROLES Pattern

Define which roles can access all data. Everyone else sees only their own.

```tsx
import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";

const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];
const EXACT_COUNT_ROLES: UserRole[] = [UserRole.ADMIN];
const EXPORT_ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];
```

## Service Patterns

### Pattern 1: User-Scoped Data (Generic Entity)

For documents, posts, orders — data owned by a specific user.
ADMIN sees all, other roles see only their own data.

```tsx
import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getDocuments(
  filters: GetDocumentsFilters,
  userId: string,
  userRole: UserRole,
): Promise<GetDocumentsResult> {
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);

  const whereClause = {
    ...(!canAccessAllData && { userId }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  const [documents, totalCount] = await prisma.$transaction([
    prisma.document.findMany({
      where: whereClause,
      select: { id: true, name: true, content: true },
      orderBy: { [filters.sortBy]: filters.order },
      skip: (filters.page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.document.count({ where: whereClause }),
  ]);

  return { documents, totalCount, totalPages, currentPage: filters.page };
}
```

### Pattern 2: Admin-Only Data

For user management, global analytics. Auth + rate limiting handled at route level.

```tsx
import "server-only";

import { DEFAULT_PAGE_SIZE } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

async function getUsers(filters: GetUsersFilters): Promise<GetUsersResult> {
  const whereClause = {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { email: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { [filters.sortBy]: filters.order },
      skip: (filters.page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  return { users, totalCount, totalPages, currentPage: filters.page };
}
```

### Pattern 3: Multi-Role Access (Team Scoping)

For cases where MANAGER sees team data, ADMIN sees all, CUSTOMER sees own.

```tsx
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];
const TEAM_SCOPED_ROLES: UserRole[] = [UserRole.MANAGER];

async function getProjects(
  filters: GetProjectsFilters,
  userId: string,
  userRole: UserRole,
): Promise<GetProjectsResult> {
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const canAccessTeamData = TEAM_SCOPED_ROLES.includes(userRole);

  let whereClause = {};

  if (canAccessAllData) {
    whereClause = {
      ...(filters.search && { name: { contains: filters.search } }),
    };
  } else if (canAccessTeamData) {
    const teamMemberIds = await getTeamMemberIds(userId);
    whereClause = {
      userId: { in: [...teamMemberIds, userId] },
      ...(filters.search && { name: { contains: filters.search } }),
    };
  } else {
    whereClause = {
      userId,
      ...(filters.search && { name: { contains: filters.search } }),
    };
  }

  // ... prisma.$transaction as usual
}
```

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
- `userId: string` + `userRole: UserRole` parameters (user-scoped services)
- `UNRESTRICTED_ROLES` constant defined
- Filter by `userId` UNLESS role in `UNRESTRICTED_ROLES`
- Explicit `select` in Prisma queries
- `take` limit on `findMany`
- `$transaction` for parallel count + findMany

Every service MUST NOT have:

- Rate limiting (belongs at entry point)
- Re-validation of filter params (nuqs parsers already validate)

## Anti-Patterns

```tsx
// ❌ Boolean permissions
async function getEntities(userId: string, isAdmin: boolean = false) {}

// ❌ Missing userId — IDOR vulnerability
async function getEntities(filters: GetEntitiesFilters) {
  await prisma.entity.findMany({ where: { name: filters.search } });
}

// ❌ Hardcoded role check
if (userRole === UserRole.ADMIN) {
  /* what about MANAGER? */
}

// ❌ String instead of UserRole
async function getEntities(userId: string, role: string) {}

// ❌ Rate limiting inside service
async function getEntities(userId: string, userRole: UserRole) {
  await checkRatelimit(filterRatelimit, userId); // belongs at entry point
}
```
