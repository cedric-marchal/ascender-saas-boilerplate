# Security Rules — IDOR Prevention & Authorization

## Context

Règles critiques pour prévenir les vulnérabilités IDOR (Insecure Direct Object Reference) et gérer les autorisations basées sur les rôles.

## Core Principles (P0)

### 1. JAMAIS de Booléens pour les Permissions

**❌ INTERDIT** :

```tsx
async function getEntity(
  filters: GetEntityFilters,
  userId: string,
  isAdmin: boolean = false, // ❌ NON EXTENSIBLE
) {}

async function canDelete(isAdmin: boolean) {} // ❌ NON TYPE-SAFE
```

**Problèmes** :

- ❌ Non extensible (que faire avec MANAGER, MODERATOR ?)
- ❌ Non type-safe (`boolean` accepte n'importe quel booléen)
- ❌ Logique dupliquée dans chaque service
- ❌ Difficile à auditer (booléens éparpillés partout)

**✅ OBLIGATOIRE : Utiliser `UserRole`**

```tsx
import { UserRole } from "@/lib/generated/prisma/client";

async function getEntity(
  filters: GetEntityFilters,
  userId: string,
  userRole: UserRole, // ✅ TYPE-SAFE, EXTENSIBLE
) {}
```

### 2. Pattern UNRESTRICTED_ROLES

**Définir explicitement** quels rôles ont accès à quelles données :

```tsx
import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";

// ✅ Rôles qui peuvent accéder à TOUTES les données (pas seulement les leurs)
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

// ✅ Rôles qui peuvent voir le count exact (pas fuzzy)
const EXACT_COUNT_ROLES: UserRole[] = [UserRole.ADMIN];

// ✅ Rôles qui peuvent combiner plusieurs filtres
const UNRESTRICTED_FILTER_ROLES: UserRole[] = [UserRole.ADMIN];

// ✅ Rôles qui peuvent exporter des données
const EXPORT_ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];

async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  userRole: UserRole,
): Promise<GetEntitiesResult> {
  // Logique claire et maintenable
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const canCombineFilters = UNRESTRICTED_FILTER_ROLES.includes(userRole);
  const canExport = EXPORT_ALLOWED_ROLES.includes(userRole);

  // Appliquer les permissions
  if (!canAccessAllData) {
    // Filtrer par userId
  }
  if (!canCombineFilters && filters.search && filters.role !== "all") {
    throw new ForbiddenError("Combinaison de filtres non autorisée");
  }
  if (!canExport) {
    // Bloquer export
  }
}
```

**Avantages** :

- ✅ Type-safe : TypeScript force `UserRole`
- ✅ Extensible : Ajouter un rôle = 1 ligne
- ✅ Maintenable : Logique centralisée
- ✅ Auditable : Facile de voir qui a quoi
- ✅ Single Source of Truth : Rôles définis dans Prisma

## Service Types & Patterns

### Pattern 1 : Service Générique (User-Scoped Data)

**Use case** : Documents, posts, orders appartenant à un utilisateur spécifique.

**Rule** : ADMIN voit tout, autres rôles voient seulement leurs données.

```tsx
import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";
import { filterRatelimit } from "@/lib/ratelimit";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getDocuments(
  filters: GetDocumentsFilters,
  userId: string, // ✅ MANDATORY
  userRole: UserRole, // ✅ MANDATORY
): Promise<GetDocumentsResult> {
  // ✅ Rate limiting par userId
  await checkRatelimit(filterRatelimit, userId);

  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);

  const whereClause = {
    // ✅ Filtrer par userId SAUF pour ADMIN
    ...(!canAccessAllData && { userId }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  const [documents, totalCount] = await prisma.$transaction([
    prisma.document.findMany({
      where: whereClause, // ✅ userId forcé pour non-admin
      select: { id: true, name: true, content: true },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.document.count({ where: whereClause }),
  ]);

  return { documents, totalCount, totalPages, currentPage: safePage };
}

// Usage dans la page
const session = await requireSession();
const { documents } = await getDocuments(
  filters,
  session.user.id,
  session.user.role,
);
```

### Pattern 2 : Service Admin-Only (Global Data)

**Use case** : Gestion des utilisateurs, analytics globales, settings système.

**Rule** : Accessible seulement via `requireAdmin()`, mais reçoit `userId` pour rate limiting.

```tsx
import "server-only";

import { filterRatelimit } from "@/lib/ratelimit";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

async function getUsers(
  filters: GetUsersFilters,
  userId: string, // ✅ Pour rate limiting (pas filtering)
): Promise<GetUsersResult> {
  // ✅ Rate limiting par userId (empêche spam même admin)
  await checkRatelimit(filterRatelimit, userId);

  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));

  // ❌ PAS de filtre userId (admin voit tous les users)
  const whereClause = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return { users, totalCount, totalPages, currentPage: safePage };
}

// Usage dans la page ADMIN
const session = await requireAdminVerifiedEmail(); // ✅ Guard avant service
const { users } = await getUsers(filters, session.user.id);
```

### Pattern 3 : Service Multi-Rôles (Complex Permissions)

**Use case** : Certains rôles (MANAGER) peuvent voir les données de leur équipe, ADMIN voit tout.

```tsx
import "server-only";

import { UserRole } from "@/lib/generated/prisma/client";

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
    // ADMIN: voit tous les projets
    whereClause = {
      ...(filters.search && { name: { contains: filters.search } }),
    };
  } else if (canAccessTeamData) {
    // MANAGER: voit projets de son équipe
    const teamMemberIds = await getTeamMemberIds(userId);
    whereClause = {
      userId: { in: [...teamMemberIds, userId] },
      ...(filters.search && { name: { contains: filters.search } }),
    };
  } else {
    // CUSTOMER: voit seulement ses propres projets
    whereClause = {
      userId,
      ...(filters.search && { name: { contains: filters.search } }),
    };
  }

  const [projects, totalCount] = await prisma.$transaction([
    prisma.project.findMany({
      where: whereClause,
      select: { id: true, name: true, userId: true },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.project.count({ where: whereClause }),
  ]);

  return { projects, totalCount };
}
```

## Security Checklist (P0)

### Every Service MUST Have

- ✅ `import "server-only"` at top
- ✅ `userId: string` parameter (for rate limiting + filtering)
- ✅ `userRole: UserRole` parameter (for authorization, NEVER boolean)
- ✅ `UNRESTRICTED_ROLES` constant defined
- ✅ `checkRatelimit(filterRatelimit, userId)` call
- ✅ Filter by `userId` UNLESS `userRole` in `UNRESTRICTED_ROLES`
- ✅ `select` explicit in Prisma queries
- ✅ `take` limit in `findMany`
- ✅ `$transaction` for parallel count + findMany
- ✅ Re-validate ALL params server-side

### Page Guard + Service Call Pattern

```tsx
// ✅ Pattern 1: User-scoped data
const session = await requireSession();
const { data } = await getUserData(filters, session.user.id, session.user.role);

// ✅ Pattern 2: Admin-only data
const session = await requireAdminVerifiedEmail();
const { data } = await getAdminData(filters, session.user.id);

// ✅ Pattern 3: Customer-only data with verification
const session = await requireCustomerVerifiedEmail();
const { data } = await getCustomerData(filters, session.user.id, session.user.role);
```

## Anti-Patterns (CRITICAL - Never Do This)

```tsx
// ❌ WRONG: Boolean for permissions
async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  isAdmin: boolean = false
) { }

// ❌ WRONG: Missing userId parameter
async function getEntities(filters: GetEntitiesFilters) {
  const entities = await prisma.entity.findMany({
    where: { name: filters.search },  // ❌ IDOR!
  });
}

// ❌ WRONG: Not filtering by userId for non-admin
async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  userRole: UserRole
) {
  const entities = await prisma.entity.findMany({
    where: { name: filters.search },  // ❌ Missing userId check!
  });
}

// ❌ WRONG: Hardcoded role check
async function getEntities(userId: string, userRole: UserRole) {
  if (userRole === UserRole.ADMIN) {  // ❌ What about future roles?
    // ...
  }
}

// ❌ WRONG: Using string instead of UserRole
async function getEntities(userId: string, role: string) {  // ❌ NOT type-safe
  if (role === "ADMIN") {  // ❌ Magic string
    // ...
  }
}

// ❌ WRONG: No rate limiting
async function getEntities(userId: string, userRole: UserRole) {
  // ❌ Missing: await checkRatelimit(filterRatelimit, userId);
  const entities = await prisma.entity.findMany({ ... });
}
```

## Testing IDOR Vulnerabilities

### Manual Test Script

```bash
# Test 1: User A cannot see User B's data
curl -H "Cookie: session-user-a" /api/documents
# Expected: Only User A's documents

curl -H "Cookie: session-user-b" /api/documents
# Expected: Only User B's documents (NOT User A's)

# Test 2: Admin can see all data
curl -H "Cookie: session-admin" /api/documents
# Expected: ALL documents from all users

# Test 3: Non-admin cannot bypass with query params
curl -H "Cookie: session-user-a" /api/documents?userId=user-b-id
# Expected: Still only User A's documents (userId param ignored)
```

### Automated Tests (Vitest)

```tsx
import { describe, expect, it } from "vitest";

import { UserRole } from "@/lib/generated/prisma/client";

import { getDocuments } from "./get-documents.service";

describe("getDocuments - IDOR Prevention", () => {
  it("should return only user's documents for CUSTOMER role", async () => {
    const result = await getDocuments(
      { search: "", page: 1 },
      "user-a-id",
      UserRole.CUSTOMER,
    );

    // Verify all returned documents belong to user-a-id
    expect(result.documents.every((doc) => doc.userId === "user-a-id")).toBe(
      true,
    );
  });

  it("should return all documents for ADMIN role", async () => {
    const result = await getDocuments(
      { search: "", page: 1 },
      "admin-id",
      UserRole.ADMIN,
    );

    // Verify documents from multiple users are returned
    const uniqueUserIds = new Set(result.documents.map((doc) => doc.userId));
    expect(uniqueUserIds.size).toBeGreaterThan(1);
  });

  it("should never leak other users' data", async () => {
    const userADocs = await getDocuments(
      { search: "", page: 1 },
      "user-a-id",
      UserRole.CUSTOMER,
    );

    const userBDocs = await getDocuments(
      { search: "", page: 1 },
      "user-b-id",
      UserRole.CUSTOMER,
    );

    // Verify no overlap between users
    const userAIds = new Set(userADocs.documents.map((d) => d.id));
    const userBIds = new Set(userBDocs.documents.map((d) => d.id));

    const intersection = [...userAIds].filter((id) => userBIds.has(id));
    expect(intersection.length).toBe(0);
  });
});
```

## Migration Guide

### Existing Service Using Boolean

**Before** :

```tsx
async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  isAdmin: boolean = false,
) {
  const whereClause = {
    ...(!isAdmin && { userId }),
  };
}
```

**After** :

```tsx
import { UserRole } from "@/lib/generated/prisma/client";

const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  userRole: UserRole, // ✅ Changed from boolean
) {
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const whereClause = {
    ...(!canAccessAllData && { userId }),
  };
}
```

**Page Update** :

```tsx
// Before
const session = await requireSession();
const isAdmin = session.user.role === UserRole.ADMIN;
const { data } = await getEntities(filters, session.user.id, isAdmin);

// After
const session = await requireSession();
const { data } = await getEntities(filters, session.user.id, session.user.role);
```

## References

- [OWASP: Insecure Direct Object References](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
- [CWE-639: Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- Prisma Best Practices: Always use `select`, never `select *`
- Defense in Depth: Validate at parsers → schemas → services → Prisma

## Related Rules

- `.claude/rules/feature.md` — Feature module structure
- `.claude/rules/filter.md` — Filter/Sort/Pagination architecture
- `SECURITY-AUDIT.md` — Complete security audit with all vulnerabilities
