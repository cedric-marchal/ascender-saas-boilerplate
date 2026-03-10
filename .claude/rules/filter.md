# Filter, Search, Sort & Pagination Rules

## Context

URL-based filters/search/sort/pagination using nuqs. Universal pattern for all filterable pages. Domino effect: changing one layer cascades to all downstream layers.

## Source of Truth Hierarchy (P0)

```
Prisma Schema (enums) → lib/generated/prisma/client
  → lib/parsers/nuqs.ts → features/{feature}/constants/{entity}-filters.constant.ts
  → features/*/schemas/ → features/*/services/ → features/*/components/ → app/*/page.tsx
```

**Rules**: Enums (`UserRole`, `SubscriptionStatus`) DEFINED in Prisma, IMPORTED directly from `@/lib/generated/prisma/client`. Domain-specific filter constants in `features/{feature}/constants/`.

## 6-Layer Architecture

| Layer | File                                                        | Responsibility                                                 |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| 1     | `lib/parsers/nuqs.ts`                                       | Global constants + Universal parsers (all query-related logic) |
| 2     | `features/{feature}/constants/{entity}-filters.constant.ts` | Domain config (searchParams, type guards, labels)              |
| 3     | `features/*/schemas/{entity}-filters.schema.ts`             | Zod validation (imports from constants)                        |
| 4     | `features/*/services/get-{entity}.service.ts`               | Server data fetch (`"server-only"`, re-validate ALL params)    |
| 5     | `app/*/page.tsx`                                            | Server Component (uses `createLoader(searchParams)`)           |
| 6     | `features/*/components/`                                    | Client components (filters, columns, pagination)               |

## Layer 1: Global Constants + Parsers (P0)

`lib/parsers/nuqs.ts`

**All query-related constants and parsers are centralized here.**

```tsx
import { createParser, parseAsStringLiteral } from "nuqs/server";

// Global limits
const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;
const MAX_ARRAY_LENGTH = 50;

// Page sizes with semantic names
const PAGE_SIZE = {
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 50,
  XLARGE: 100,
} as const;

const PAGE_SIZES = Object.values(PAGE_SIZE); // [10, 20, 50, 100] for select
const DEFAULT_PAGE_SIZE = PAGE_SIZE.SMALL; // 10

// Sort orders and defaults
const SORT_ORDERS = ["asc", "desc"] as const;
const DEFAULT_SORT_ORDER = "desc" as const;
const DEFAULT_SORT_BY = "createdAt" as const;

// Universal parsers
const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query) return "";
    return query.slice(0, MAX_SEARCH_LENGTH).trim();
  },
  serialize(value) {
    return value;
  },
});

const parseAsPageSize = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    return (PAGE_SIZES as readonly number[]).includes(parsed)
      ? parsed
      : PAGE_SIZE.SMALL; // Fallback sur SMALL (10) si invalide
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsOrder = parseAsStringLiteral(SORT_ORDERS);

// Factory functions
function createEnumParser<T extends readonly string[]>(enumValues: T) {
  return parseAsStringLiteral(enumValues);
}

function createSortByParser<T extends readonly string[]>(allowedFields: T) {
  return parseAsStringLiteral(allowedFields);
}

// Types
type PageSize = (typeof PAGE_SIZES)[number]; // 10 | 20 | 50 | 100
type SortOrder = (typeof SORT_ORDERS)[number]; // "asc" | "desc"

export {
  createEnumParser,
  createSortByParser,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_ARRAY_LENGTH,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  PAGE_SIZES,
  parseAsOrder,
  parseAsPage,
  parseAsPageSize,
  parseAsSafeSearch,
  SORT_ORDERS,
};
export type { PageSize, SortOrder };
```

**Rules**:

- ALL query constants and parsers centralized in `nuqs.ts`
- `PAGE_SIZE` object with semantic names (SMALL/MEDIUM/LARGE/XLARGE)
- `PAGE_SIZES` array for select components
- `DEFAULT_PAGE_SIZE` points to `PAGE_SIZE.SMALL`
- `parseAsPageSize` validates against `PAGE_SIZES` with fallback
- `parseAsSafeSearch` MUST truncate (`.slice()`) not reject
- Factory functions wrap `parseAsStringLiteral`

## Layer 2: Domain Configuration (P0)

`features/{feature}/constants/{entity}-filters.constant.ts`

```tsx
import { UserRole } from "@/lib/generated/prisma/client";
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
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.CUSTOMER]: "Client",
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

## Layer 3: Validation Schema (P0)

`features/*/schemas/{entity}-filters.schema.ts`

```tsx
import { z } from "zod";

import {
  userRoleFilters,
  verificationFilters,
} from "@/features/users/constants/users-filters.constant";

import { MAX_SEARCH_LENGTH } from "@/lib/parsers/nuqs";

const FilterUsersSchema = z.object({
  search: z
    .string()
    .max(MAX_SEARCH_LENGTH, `Max ${MAX_SEARCH_LENGTH} caractères`)
    .trim(),
  role: z.enum(userRoleFilters, { message: "Rôle invalide" }),
  verified: z.enum(verificationFilters, { message: "Statut invalide" }),
});

type FilterUsersSchemaType = z.infer<typeof FilterUsersSchema>;
export { FilterUsersSchema };
export type { FilterUsersSchemaType };
```

**Rules**:

- IMPORTS enum arrays from feature constants (never defines them)
- IMPORTS limits from `@/lib/parsers/nuqs`
- Validates form fields only (not `sortBy`/`order`/`page` — parsers validate those)

## Layer 4: Server Data Fetching (P0)

`features/*/services/get-{entity}.service.ts`

| Rule              | Convention                                                 |
| ----------------- | ---------------------------------------------------------- |
| **Protection**    | `import "server-only"` at top                              |
| **Re-validation** | ALL params re-validated server-side (defense in depth)     |
| **Prisma**        | `$transaction` for parallel `findMany` + `count`           |
| **Select**        | Always `select` + `take` on `findMany`                     |
| **OrderBy**       | Dynamic: `{ [safeSortBy]: safeOrder }`                     |
| **Type guards**   | Use from feature constants (e.g., `isUserRole()`)          |
| **Defaults**      | Fall back to `DEFAULT_SORT_BY`, `DEFAULT_SORT_ORDER`, etc. |

```tsx
import "server-only";

import {
  isUserRole,
  usersSortableFields,
} from "@/features/users/constants/users-filters.constant";

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  SORT_ORDERS,
  type SortOrder,
} from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

async function getUsers(filters: GetUsersFilters) {
  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));
  const safeRole = isUserRoleFilter(filters.role) ? filters.role : "all";

  const safeSortBy = (usersSortableFields as readonly string[]).includes(
    filters.sortBy,
  )
    ? filters.sortBy
    : DEFAULT_SORT_BY;

  const safeOrder: SortOrder = (SORT_ORDERS as readonly string[]).includes(
    filters.order,
  )
    ? (filters.order as SortOrder)
    : DEFAULT_SORT_ORDER;

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
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
    currentPage: safePage,
  };
}
```

## Layer 5: Server Page (P0)

```tsx
import { createLoader, type SearchParams } from "nuqs/server";

import { usersSearchParams } from "@/features/users/constants/users-filters.constant";
import { getUsers } from "@/features/users/services/get-users.service";

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

## Layer 6: Client Components

### 6a. Filter Component

`features/*/components/{entity}-filters.tsx`

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/features/users/constants/users-filters.constant";
import { FilterUsersSchema } from "@/features/users/schemas/users-filters.schema";

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

### 6b. SortableHeader in Columns

`features/*/components/{entity}-columns.tsx`

```tsx
"use client";

import { useTransition } from "react";

import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/features/users/constants/users-filters.constant";

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

### 6c. DataTable (Dumb Renderer)

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

### 6d. Pagination Component

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
      .withOptions({ shallow: false, startTransition, history: "push" }),
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

### 6e. Page Size Selector (Optional)

`components/page-size-selector.tsx`

```tsx
"use client";

import { useTransition } from "react";

import { useQueryState } from "nuqs";

import { PAGE_SIZE, PAGE_SIZES, parseAsPageSize } from "@/lib/parsers/nuqs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PageSizeSelector() {
  const [isLoading, startTransition] = useTransition();
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsPageSize.withDefault(PAGE_SIZE.SMALL).withOptions({
      shallow: false,
      history: "push",
      startTransition,
    }),
  );

  return (
    <Select
      value={pageSize.toString()}
      onValueChange={(value: string) => {
        setPageSize(parseInt(value, 10));
      }}
      disabled={isLoading}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAGE_SIZES.map((size: number) => (
          <SelectItem key={size} value={size.toString()}>
            {size} par page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { PageSizeSelector };
```

**Rules**:

- Uses `PAGE_SIZES` array to map options
- Uses `parseAsPageSize` parser with `PAGE_SIZE.SMALL` default
- Validates against `PAGE_SIZES` with automatic fallback
- Type-safe: `PageSize = 10 | 20 | 50 | 100`

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
// ❌ Parsers re-exporting constants → consumers import parsers from lib/parsers/nuqs.ts, enums from features/*/constants/
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

1. **Single source of truth**: Prisma → `lib/generated/prisma/client` → `lib/parsers/nuqs.ts` → `features/*/constants/` → Schema → Components
2. **Domino effect**: Changing one layer cascades automatically
3. **Defense in depth**: Validate at parser, schema, AND server
4. **Server-side everything**: DataTable is dumb renderer
5. **3-state sort**: unsorted → asc → desc → reset
6. **useTransition everywhere**: All URL mutations use startTransition
7. **Enums from Prisma**: Import `UserRole` directly from `@/lib/generated/prisma/client`, domain filter arrays in `features/*/constants/`
8. **Parsers in nuqs.ts**: All query parsers and constants centralized in `lib/parsers/nuqs.ts`
9. **Truncate, don't reject**: parseAsSafeSearch uses .slice()
10. **null to clear**: Remove params with null, not empty strings
11. **select + take always**: Every findMany must have both
12. **$transaction for parallel**: Count + findMany together
