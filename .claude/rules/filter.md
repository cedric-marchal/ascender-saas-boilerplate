# Filter, Search, Sort & Pagination Rules

## Context

URL-based filters/search/sort/pagination using nuqs. Universal pattern for all filterable pages. Domino effect: changing one layer cascades to all downstream layers.

## Source of Truth Hierarchy (P0)

```
Prisma Schema (enums) → lib/generated/prisma/client → lib/constants/*.constant.ts
  → lib/parsers/nuqs.ts → lib/constants/{entity}-filters.constant.ts
  → features/*/schemas/ → features/*/services/ → features/*/components/ → app/*/page.tsx
```

**Rules**: Enums DEFINED in Prisma, RE-EXPORTED by `lib/constants/`, IMPORTED by app code. NEVER import from Prisma directly.

## 7-Layer Architecture

| Layer | File                                            | Responsibility                                                         |
| ----- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | `lib/constants/query.constant.ts`               | Global limits (maxPage, maxSearchLength, pageSizes, orders)            |
| 2     | `lib/parsers/nuqs.ts`                           | Universal parsers (`parseAsPage`, `parseAsSafeSearch`, `parseAsOrder`) |
| 3     | `lib/constants/{entity}-filters.constant.ts`    | Domain config (searchParams, type guards, labels)                      |
| 4     | `features/*/schemas/{entity}-filters.schema.ts` | Zod validation (imports from constants)                                |
| 5     | `features/*/services/get-{entity}.service.ts`   | Server data fetch (`"server-only"`, re-validate ALL params)            |
| 6     | `app/*/page.tsx`                                | Server Component (uses `createLoader(searchParams)`)                   |
| 7     | `features/*/components/`                        | Client components (filters, columns, pagination)                       |

## Layer 1: Global Constants (P0)

`lib/constants/query.constant.ts`

```tsx
const QUERY = createQueryConfig({
  pagination: {
    maxPage: 1000,
    pageSizes: [10, 12, 20, 25, 50, 100] as const,
    defaultPageSize: 12,
  },
  filters: { maxSearchLength: 100, maxArrayLength: 50 },
  sorting: {
    orders: ["asc", "desc"] as const,
    defaultOrder: "desc",
    defaultSortBy: "createdAt",
  },
});

const PAGINATION = QUERY.pagination;
const FILTERS = QUERY.filters;
const SORTING = QUERY.sorting;

export { FILTERS, PAGINATION, SORTING };
```

## Layer 2: Universal Parsers (P0)

`lib/parsers/nuqs.ts`

```tsx
import { createParser, parseAsStringLiteral } from "nuqs/server";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    return Number.isNaN(parsed) || parsed < 1
      ? 1
      : Math.min(parsed, PAGINATION.maxPage);
  },
  serialize: (value) => String(value),
});

const parseAsSafeSearch = createParser({
  parse: (query) =>
    query ? query.slice(0, FILTERS.maxSearchLength).trim() : "",
  serialize: (value) => value,
});

const parseAsOrder = parseAsStringLiteral(SORTING.orders);

function createEnumParser<T extends readonly string[]>(enumValues: T) {
  return parseAsStringLiteral(enumValues);
}

function createSortByParser<T extends readonly string[]>(allowedFields: T) {
  return parseAsStringLiteral(allowedFields);
}

export {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
};
export type { PageSize, SortOrder };
```

**Rules**:

- Parsers MUST NOT re-export constants
- `parseAsSafeSearch` MUST truncate (`.slice()`) not reject
- Factory functions wrap `parseAsStringLiteral`

## Layer 3: Domain Configuration (P0)

`lib/constants/{entity}-filters.constant.ts`

```tsx
import {
  UserRole,
  roleLabels as baseRoleLabels,
} from "@/lib/constants/roles.constant";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type UserRoleFilter = "all" | UserRole;
type VerificationFilter = "all" | "verified" | "unverified";

const userRoleFilters = ["all", UserRole.ADMIN, UserRole.CUSTOMER] as const;
const verificationFilters = ["all", "verified", "unverified"] as const;
const usersSortableFields = ["name", "email", "createdAt"] as const;

const roleLabels: Record<UserRoleFilter, string> = {
  all: "Tous les rôles",
  ...baseRoleLabels,
};
const verificationLabels: Record<VerificationFilter, string> = {
  all: "Tous",
  verified: "Vérifiés",
  unverified: "Non vérifiés",
};

const usersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: createEnumParser(userRoleFilters).withDefault("all"),
  verified: createEnumParser(verificationFilters).withDefault("all"),
  sortBy: createSortByParser(usersSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

function isUserRole(value: string): value is UserRole {
  return value === UserRole.ADMIN || value === UserRole.CUSTOMER;
}

export { isUserRole, roleLabels, usersSearchParams, usersSortableFields };
export type { UserRoleFilter, VerificationFilter };
```

**Rules**:

- Enum arrays MUST use `as const`
- `searchParams` MUST include `sortBy`, `order`, `page`
- Type guards defined here for server validation
- Labels defined here (single source for UI)

## Layer 4: Validation Schema (P0)

`features/*/schemas/{entity}-filters.schema.ts`

```tsx
import { z } from "zod";

import { FILTERS } from "@/lib/constants/query.constant";
import {
  userRoleFilters,
  verificationFilters,
} from "@/lib/constants/users-filters.constant";

const FilterUsersSchema = z.object({
  search: z
    .string()
    .max(FILTERS.maxSearchLength, `Max ${FILTERS.maxSearchLength} caractères`)
    .trim(),
  role: z.enum(userRoleFilters, { message: "Rôle invalide" }),
  verified: z.enum(verificationFilters, { message: "Statut invalide" }),
});

type FilterUsersSchemaType = z.infer<typeof FilterUsersSchema>;
export { FilterUsersSchema };
export type { FilterUsersSchemaType };
```

**Rules**:

- IMPORTS enum arrays from constants (never defines them)
- Validates form fields only (not `sortBy`/`order`/`page` — parsers validate those)

## Layer 5: Server Data Fetching (P0)

`features/*/services/get-{entity}.service.ts`

| Rule              | Convention                                                   |
| ----------------- | ------------------------------------------------------------ |
| **Protection**    | `import "server-only"` at top                                |
| **Re-validation** | ALL params re-validated server-side (defense in depth)       |
| **Prisma**        | `$transaction` for parallel `findMany` + `count`             |
| **Select**        | Always `select` + `take` on `findMany`                       |
| **OrderBy**       | Dynamic: `{ [safeSortBy]: safeOrder }`                       |
| **Type guards**   | Use from constants (e.g., `isUserRole()`)                    |
| **Defaults**      | Fall back to `SORTING.defaultSortBy`, `SORTING.defaultOrder` |

```tsx
import "server-only";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";
import {
  isUserRole,
  usersSortableFields,
} from "@/lib/constants/users-filters.constant";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = PAGINATION.defaultPageSize;

async function getUsers(filters: GetUsersFilters) {
  const safeSearch = filters.search.slice(0, FILTERS.maxSearchLength).trim();
  const safePage = Math.max(1, Math.min(filters.page, PAGINATION.maxPage));
  const safeRole = isUserRoleFilter(filters.role) ? filters.role : "all";
  const safeSortBy = (usersSortableFields as readonly string[]).includes(
    filters.sortBy
  )
    ? filters.sortBy
    : SORTING.defaultSortBy;
  const safeOrder = (SORTING.orders as readonly string[]).includes(
    filters.order
  )
    ? filters.order
    : SORTING.defaultOrder;

  const whereClause = {
    ...(safeSearch && {
      OR: [{ name: { contains: safeSearch, mode: "insensitive" as const } }],
    }),
    ...(safeRole !== "all" && isUserRole(safeRole) && { role: safeRole }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    currentPage: safePage,
  };
}
```

## Layer 6: Server Page (P0)

```tsx
import { getUsers } from "@/features/users/services/get-users.service";
import { type SearchParams, createLoader } from "nuqs/server";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";

const loadSearchParams = createLoader(usersSearchParams);

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await loadSearchParams(searchParams);
  const { users, totalCount, totalPages, currentPage } =
    await getUsers(filters);

  return (
    <main>
      <UsersFilters />
      <DataTable columns={usersColumns} data={users} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
}
```

**Rules**:

- `createLoader(searchParams)` is ONLY place parsers connect to page
- Page does NOT re-validate (service does it)
- DataTable receives raw data (no client-side sort/filter/pagination)

## Layer 7: Client Components

### 7a. Filter Component

`features/*/components/{entity}-filters.tsx`

```tsx
"use client";
import { FilterUsersSchema } from "@/features/users/schemas/users-filters.schema";
import { useForm } from "@tanstack/react-form";
import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";

function UsersFilters() {
  const [isLoading, startTransition] = useTransition();
  const [urlFilters, setUrlFilters] = useQueryStates(usersSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });

  const form = useForm({
    defaultValues: {
      search: urlFilters.search || "",
      role: urlFilters.role || "all",
    },
    validators: { onSubmit: FilterUsersSchema },
    onSubmit: async ({ value }) => {
      setUrlFilters({
        search: value.search || null,
        role: value.role === "all" ? null : value.role,
        page: 1,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {/* fields */}
    </form>
  );
}
```

**Rules**: `useTransition` + `shallow: false` + `history: "push"` + reset `page: 1` on filter change + use `null` to clear params

### 7b. SortableHeader in Columns

`features/*/components/{entity}-columns.tsx`

```tsx
"use client";
import { useTransition } from "react";

import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";

function SortableHeader({ field, label }: { field: string; label: string }) {
  const [isLoading, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(usersSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });
  const isActive = filters.sortBy === field;

  function handleSort() {
    if (isActive && filters.order === "desc") {
      setFilters({ sortBy: null, order: null, page: 1 }); // Reset
      return;
    }
    setFilters({
      sortBy: field,
      order: isActive && filters.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  }

  return (
    <Button onClick={handleSort} disabled={isLoading}>
      {label} <SortIcon />
    </Button>
  );
}

const usersColumns: ColumnDef[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" label="Nom" />,
  },
  {
    accessorKey: "email",
    header: () => <SortableHeader field="email" label="Email" />,
  },
];
```

**Rules**: 3-state toggle (`unsorted → asc → desc → reset`), reset sets `sortBy: null, order: null`, `field` MUST match value in `{entity}SortableFields`

### 7c. DataTable (Dumb Renderer)

`components/ui/data-table.tsx`

```tsx
"use client";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

function DataTable({ columns, data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <Table>{/* render */}</Table>;
}
```

**Rules**: ONLY `getCoreRowModel()` — NO `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`

### 7d. Pagination Component

`components/pagination.tsx`

```tsx
"use client";
import { useTransition } from "react";

import { useQueryState } from "nuqs";

import { parseAsPage } from "@/lib/parsers/nuqs";

function Pagination({ currentPage, totalPages }) {
  const [isLoading, startTransition] = useTransition();
  const [, setPage] = useQueryState(
    "page",
    parseAsPage
      .withDefault(1)
      .withOptions({ shallow: false, startTransition, history: "push" })
  );

  return totalPages <= 1 ? null : (
    <nav>
      <Button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
      >
        Précédent
      </Button>
      <span>
        Page {currentPage} sur {totalPages}
      </span>
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
      >
        Suivant
      </Button>
    </nav>
  );
}
```

**Rules**: Uses `useQueryState` (single param), hides when `totalPages <= 1`, disables at boundaries

## Nuqs Options (P0)

| Option            | Value   | Reason                             |
| ----------------- | ------- | ---------------------------------- |
| `shallow`         | `false` | Server re-fetches data             |
| `history`         | `push`  | Back button works                  |
| `startTransition` | Used    | Shows loading state                |
| `withDefault()`   | Always  | Prevents null, ensures type safety |

## Security (P0)

Validate at EVERY layer: Parser (bounds/length/enum) → Schema (Zod) → Server (re-validate all) → Prisma (parameterized queries) → React (auto-escaping)

| Attack         | Protection                     |
| -------------- | ------------------------------ |
| SQL Injection  | Prisma parameterized queries   |
| XSS via search | React auto-escapes             |
| Invalid enum   | `parseAsStringLiteral` rejects |
| Negative page  | `createParser` with min(1)     |
| Huge page      | `createParser` with max(1000)  |
| Long search    | `parseAsSafeSearch` truncates  |

## Anti-Patterns

```tsx
// ❌ Parsers inline in page file → MUST be in lib/parsers/nuqs.ts
// ❌ Enums in schema → MUST be in constants
// ❌ Parsers re-exporting constants → consumers import from query.constant.ts
// ❌ parseAsSafeSearch rejecting → MUST truncate with .slice()
// ❌ Client-side sorting in DataTable → getSortedRowModel(), getFilteredRowModel(), getPaginationRowModel()
// ❌ Not using useTransition → no loading feedback
// ❌ shallow: true → server won't re-fetch
// ❌ history: "replace" → breaks back button
// ❌ Not resetting page on filter change → setFilters({ role: value }) missing page: 1
// ❌ Empty string to clear → setFilters({ search: "" }) use null
// ❌ Trusting parsed values → prisma.findMany({ skip: (page - 1) * SIZE }) MUST re-validate
// ❌ findMany without select+take → prisma.user.findMany({ where })
// ❌ Sequential count+findMany → use $transaction
// ❌ 2-state sort → MUST be 3-state (unsorted → asc → desc → reset)
```

## Key Principles

1. **Single source of truth**: Prisma → Constants → Parsers → Domain Config → Schema → Components
2. **Domino effect**: Changing one layer cascades automatically
3. **Defense in depth**: Validate at parser, schema, AND server
4. **Server-side everything**: DataTable is dumb renderer
5. **3-state sort**: unsorted → asc → desc → reset
6. **useTransition everywhere**: All URL mutations use startTransition
7. **Enums in constants**: Defined in constants, imported by schemas
8. **Parsers don't re-export**: Consumers import from query.constant.ts
9. **Truncate, don't reject**: parseAsSafeSearch uses .slice()
10. **null to clear**: Remove params with null, not empty strings
11. **select + take always**: Every findMany must have both
12. **$transaction for parallel**: Count + findMany together
