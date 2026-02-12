# Filter, Search, Sort & Pagination Rules

## Context

These rules apply to creating URL-based filters, search, sorting, and pagination using nuqs in Next.js App Router. This is the universal pattern for all filterable/sortable pages. Every layer has a single source of truth with a domino effect: changing one layer automatically propagates to all downstream layers.

## Source of Truth Hierarchy (P0)

```
Prisma Schema / Stripe / R2        ← External sources of truth
        ↓
lib/constants/query.constant.ts    ← Global limits (page, search, sort)
        ↓
lib/parsers/nuqs.ts                ← Universal reusable parsers
        ↓
lib/constants/{entity}-filters.constant.ts  ← Domain enums, labels, searchParams
        ↓
lib/schemas/search/{entity}-filters.schema.ts  ← Zod validation (imports enums from constants)
        ↓
app/.../{entity}/_lib/get-{entity}.ts  ← Server data fetching (defense in depth)
        ↓
app/.../{entity}/page.tsx          ← Server page (createLoader + render)
        ↓
app/.../{entity}/_components/      ← Client components (filters, columns, pagination)
```

**Key rule**: Enums and filter values are DEFINED in constants, IMPORTED by schemas and components. Never the reverse.

## File Structure (P0)

```
lib/
├── constants/
│   ├── query.constant.ts              # Global pagination/filter/sort limits
│   └── {entity}-filters.constant.ts   # Domain enums, labels, searchParams
├── parsers/
│   └── nuqs.ts                        # Universal reusable parsers + factories
├── schemas/
│   └── search/
│       └── {entity}-filters.schema.ts # Zod validation schema
app/(protected)/admin/{entity}/
├── _lib/
│   └── get-{entity}.ts               # Server-only data fetching
├── _components/
│   ├── {entity}-filters.tsx           # Client filter form
│   └── {entity}-columns.tsx           # Table columns + SortableHeader
├── page.tsx                           # Server page
└── loading.tsx                        # Loading skeleton
components/
├── ui/data-table.tsx                  # Generic dumb DataTable renderer
└── pagination.tsx                     # Generic pagination component
```

## Layer 1: Global Constants (P0)

`lib/constants/query.constant.ts`

Single source of truth for ALL pagination, filter, and sort limits across the app. Changing a value here cascades everywhere.

```tsx
function createQueryConfig<
  TPageSizes extends readonly number[],
  TOrders extends readonly string[],
>(config: {
  pagination: {
    maxPage: number;
    pageSizes: TPageSizes;
    defaultPageSize: TPageSizes[number];
  };
  filters: {
    maxSearchLength: number;
    maxArrayLength: number;
  };
  sorting: {
    orders: TOrders;
    defaultOrder: TOrders[number];
    defaultSortBy: string;
  };
}) {
  return config;
}

const QUERY = createQueryConfig({
  pagination: {
    maxPage: 1000,
    pageSizes: [10, 12, 20, 25, 50, 100] as const,
    defaultPageSize: 12,
  },
  filters: {
    maxSearchLength: 100,
    maxArrayLength: 50,
  },
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

Reusable parsers and factories. Imports limits from `query.constant.ts`. Does NOT re-export constants.

```tsx
import { createParser, parseAsStringLiteral } from "nuqs/server";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";

type PageSize = (typeof PAGINATION.pageSizes)[number];
type SortOrder = (typeof SORTING.orders)[number];

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, PAGINATION.maxPage);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query) {
      return "";
    }
    return query.slice(0, FILTERS.maxSearchLength).trim();
  },
  serialize(value) {
    return value;
  },
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

- Parsers MUST NOT re-export constants (consumers import directly from `query.constant.ts`)
- `parseAsSafeSearch` MUST truncate (`.slice()`) instead of reject long strings
- Factory functions (`createEnumParser`, `createSortByParser`) wrap `parseAsStringLiteral`

## Layer 3: Domain Configuration (P0)

`lib/constants/{entity}-filters.constant.ts`

Domain-specific enums, labels, and searchParams. Enums are DEFINED here, sourced from Prisma types.

```tsx
import type { User } from "@/lib/generated/prisma/client";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type UserRole = User["role"];
type UserRoleFilter = "all" | UserRole;
type VerificationFilter = "all" | "verified" | "unverified";

const userRoleFilters = ["all", "ADMIN", "CUSTOMER"] as const;
const verificationFilters = ["all", "verified", "unverified"] as const;
const usersSortableFields = ["name", "email", "createdAt"] as const;

type UserSortableField = (typeof usersSortableFields)[number];

const roleLabels: Record<UserRoleFilter, string> = {
  all: "Tous les rôles",
  ADMIN: "Admin",
  CUSTOMER: "Client",
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
  return value === "ADMIN" || value === "CUSTOMER";
}

function isUserRoleFilter(value: string): value is UserRoleFilter {
  return (userRoleFilters as readonly string[]).includes(value);
}

function isVerificationFilter(value: string): value is VerificationFilter {
  return (verificationFilters as readonly string[]).includes(value);
}

export {
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  roleLabels,
  userRoleFilters,
  usersSearchParams,
  usersSortableFields,
  verificationFilters,
  verificationLabels,
};

export type { UserRole, UserRoleFilter, UserSortableField, VerificationFilter };
```

**Rules**:

- Enum arrays MUST use `as const` for literal types
- `searchParams` MUST include `sortBy`, `order`, and `page` alongside filters
- Type guards (`isUserRole`, etc.) are defined here for server-side validation
- Labels are defined here (single source for UI display)
- Prisma types (`User["role"]`) are the source for role values

## Layer 4: Validation Schema (P0)

`lib/schemas/search/{entity}-filters.schema.ts`

Zod schema for form validation. IMPORTS enums from constants (never defines them).

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
    .max(
      FILTERS.maxSearchLength,
      `La recherche doit contenir moins de ${FILTERS.maxSearchLength} caractères`
    )
    .trim(),
  role: z.enum(userRoleFilters, {
    message: "Rôle invalide",
  }),
  verified: z.enum(verificationFilters, {
    message: "Statut de vérification invalide",
  }),
});

type FilterUsersSchemaType = z.infer<typeof FilterUsersSchema>;

export { FilterUsersSchema };

export type { FilterUsersSchemaType };
```

**Rules**:

- Schema IMPORTS enum arrays from constants (never defines them)
- `FILTERS.maxSearchLength` comes from `query.constant.ts` (not hardcoded)
- Schema validates form fields only (not `sortBy`/`order`/`page` — those are validated by parsers)

## Layer 5: Server Data Fetching (P0)

`app/.../{entity}/_lib/get-{entity}.ts`

Server-only function with defense-in-depth validation. Imports constants directly from `query.constant.ts`.

```tsx
import "server-only";

import { FILTERS, PAGINATION, SORTING } from "@/lib/constants/query.constant";
import {
  type UserRoleFilter,
  type UserSortableField,
  type VerificationFilter,
  isUserRole,
  isUserRoleFilter,
  isVerificationFilter,
  usersSortableFields,
} from "@/lib/constants/users-filters.constant";
import type { User } from "@/lib/generated/prisma/client";
import type { SortOrder } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = PAGINATION.defaultPageSize;

type GetUsersFilters = {
  search: string;
  role: string;
  verified: string;
  sortBy: string;
  order: string;
  page: number;
};

type GetUsersResult = {
  users: Pick<
    User,
    "id" | "name" | "email" | "role" | "emailVerified" | "image" | "createdAt"
  >[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getUsers(filters: GetUsersFilters): Promise<GetUsersResult> {
  const safeSearch = filters.search.slice(0, FILTERS.maxSearchLength).trim();
  const safePage = Math.max(1, Math.min(filters.page, PAGINATION.maxPage));

  const safeRole: UserRoleFilter = isUserRoleFilter(filters.role)
    ? filters.role
    : "all";

  const safeVerified: VerificationFilter = isVerificationFilter(
    filters.verified
  )
    ? filters.verified
    : "all";

  const safeSortBy: UserSortableField = (
    usersSortableFields as readonly string[]
  ).includes(filters.sortBy)
    ? (filters.sortBy as UserSortableField)
    : (SORTING.defaultSortBy as UserSortableField);

  const safeOrder: SortOrder = (SORTING.orders as readonly string[]).includes(
    filters.order
  )
    ? (filters.order as SortOrder)
    : SORTING.defaultOrder;

  const whereClause = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(safeRole !== "all" && isUserRole(safeRole) && { role: safeRole }),
    ...(safeVerified === "verified" && { emailVerified: true }),
    ...(safeVerified === "unverified" && { emailVerified: false }),
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
      },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    users,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export { getUsers };

export type { GetUsersFilters, GetUsersResult };
```

**Rules**:

- MUST use `import "server-only"` at top
- MUST re-validate ALL values server-side (defense in depth)
- MUST use `prisma.$transaction` for parallel `findMany` + `count`
- MUST use `select` to specify returned fields
- MUST use `take` (every `findMany` is internally paginated)
- `orderBy` MUST be dynamic: `{ [safeSortBy]: safeOrder }`
- Filter types (`GetUsersFilters`) accept `string` for all params (server validates)

## Layer 6: Server Page (P0)

`app/.../{entity}/page.tsx`

Server Component. Uses `createLoader` to parse URL params and passes them to the data fetching function. The domino effect means adding a new param to `usersSearchParams` automatically flows through.

```tsx
import type { Metadata } from "next";

import { type SearchParams, createLoader } from "nuqs/server";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";
import { requireAdminVerifiedEmail } from "@/lib/session";

import { Pagination } from "@/components/pagination";
import { DataTable } from "@/components/ui/data-table";

import {
  type UserTableData,
  usersColumns,
} from "@/app/(protected)/admin/utilisateurs/_components/users-columns";
import { UsersFilters } from "@/app/(protected)/admin/utilisateurs/_components/users-filters";
import { getUsers } from "@/app/(protected)/admin/utilisateurs/_lib/get-users";

const loadSearchParams = createLoader(usersSearchParams);

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminUsersPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await requireAdminVerifiedEmail();

  const filters = await loadSearchParams(searchParams);

  const { users, totalCount, totalPages, currentPage } =
    await getUsers(filters);

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted-foreground">
          {totalCount} utilisateur{totalCount > 1 ? "s" : ""} trouvé
          {totalCount > 1 ? "s" : ""}
        </p>
      </header>

      <UsersFilters />

      <section className="space-y-4">
        <DataTable columns={usersColumns} data={users as UserTableData[]} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </main>
  );
}
```

**Rules**:

- `createLoader(usersSearchParams)` is the ONLY place parsers are connected to the page
- Page does NOT re-validate (that's the server data fetching layer's job)
- `DataTable` receives raw data and columns — no client-side sorting/filtering

## Layer 7: Client Components

### 7a. Filter Component (P0)

`_components/{entity}-filters.tsx`

Uses TanStack Form for local state + Zod validation, and `useQueryStates` for URL sync on submit.

```tsx
"use client";

import { type ChangeEvent, type SubmitEvent, useTransition } from "react";

import { useForm } from "@tanstack/react-form";
import { Filter, Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";

import {
  type UserRoleFilter,
  type VerificationFilter,
  roleLabels,
  userRoleFilters,
  usersSearchParams,
  verificationFilters,
  verificationLabels,
} from "@/lib/constants/users-filters.constant";
import { FilterUsersSchema } from "@/lib/schemas/search/users-filters.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function UsersFilters() {
  const [isLoading, startTransition] = useTransition();

  const [urlFilters, setUrlFilters] = useQueryStates(usersSearchParams, {
    shallow: false,
    history: "push",
    startTransition,
  });

  const formInstance = useForm({
    defaultValues: {
      search: urlFilters.search || "",
      role: urlFilters.role || ("all" as UserRoleFilter),
      verified: urlFilters.verified || ("all" as VerificationFilter),
    },
    validators: {
      onSubmit: FilterUsersSchema,
    },
    onSubmit: async ({ value }) => {
      setUrlFilters({
        search: value.search || null,
        role: value.role === "all" ? null : value.role,
        verified: value.verified === "all" ? null : value.verified,
        page: 1,
      });
    },
  });

  function handleClearFilters() {
    formInstance.reset();
    setUrlFilters({
      search: null,
      role: null,
      verified: null,
      page: null,
    });
  }

  const hasActiveFilters =
    urlFilters.search ||
    urlFilters.role !== "all" ||
    urlFilters.verified !== "all";

  return (
    <section className="mb-6 space-y-4">
      <form
        onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault();
          formInstance.handleSubmit();
        }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        {/* Search, Select fields, Submit button, Clear button */}
      </form>
    </section>
  );
}

export { UsersFilters };
```

**Rules**:

- MUST use `useTransition` with `startTransition` passed to `useQueryStates`
- MUST set `shallow: false` and `history: "push"`
- MUST reset `page: 1` when filters change
- MUST use `null` to remove params from URL (not empty string)
- TanStack Form handles local state + Zod validation, `onSubmit` syncs to URL
- `handleClearFilters` resets both form and URL state

### 7b. SortableHeader in Columns (P0)

`_components/{entity}-columns.tsx`

Column definitions with URL-based server-side sorting via `SortableHeader`.

```tsx
"use client";

import { useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";
import type { User } from "@/lib/generated/prisma/client";

import { Button } from "@/components/ui/button";

export type UserTableData = Pick<
  User,
  "id" | "name" | "email" | "role" | "emailVerified" | "image" | "createdAt"
>;

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
      setFilters({
        sortBy: null,
        order: null,
        page: 1,
      });
      return;
    }

    setFilters({
      sortBy: field,
      order: isActive && filters.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  }

  const SortIcon = isActive
    ? filters.order === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSort}
      disabled={isLoading}
    >
      {label}
      <SortIcon className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

const usersColumns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "name",
    header: () => <SortableHeader field="name" label="Nom" />,
    cell: ({ row }) => {
      // Custom cell rendering
    },
  },
  {
    accessorKey: "email",
    header: () => <SortableHeader field="email" label="Email" />,
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <SortableHeader field="createdAt" label="Date d'inscription" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(date);
    },
  },
];

export { usersColumns };
```

**Rules**:

- `SortableHeader` is defined in the columns file (co-located)
- Uses `useQueryStates` with the SAME `usersSearchParams` (single source of truth)
- 3-state sort toggle: `unsorted → asc → desc → reset`
- Reset sets `sortBy: null, order: null` which falls back to `withDefault()` values
- `field` prop MUST match a value in `usersSortableFields`
- Non-sortable columns use plain string header: `header: "Rôle"`

### 7c. DataTable — Dumb Renderer (P0)

`components/ui/data-table.tsx`

Generic table renderer. NO client-side sorting, filtering, or pagination.

```tsx
"use client";

import { useState } from "react";

import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
};

function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "Aucun résultat",
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>{/* Header and body rendering */}</Table>
    </div>
  );
}

export { DataTable };
```

**Rules**:

- ONLY uses `getCoreRowModel()` — no `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
- Keeps `columnVisibility` and `rowSelection` (legitimate client-side UI state)
- Sorting is handled server-side via `SortableHeader` → URL → server re-render
- Filtering is handled server-side via `UsersFilters` → URL → server re-render
- Pagination is handled server-side via `Pagination` → URL → server re-render

### 7d. Pagination Component (P0)

`components/pagination.tsx`

Generic reusable pagination. Uses `parseAsPage` from universal parsers.

```tsx
"use client";

import { useTransition } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";

import { parseAsPage } from "@/lib/parsers/nuqs";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

function Pagination({ currentPage, totalPages }: PaginationProps) {
  const [isLoading, startTransition] = useTransition();

  const [, setPage] = useQueryState(
    "page",
    parseAsPage.withDefault(1).withOptions({
      shallow: false,
      startTransition,
      history: "push",
    })
  );

  function handlePrevious() {
    if (currentPage > 1) {
      setPage(currentPage - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
    }
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage <= 1 || isLoading}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Précédent
      </Button>

      <span className="text-sm text-gray-600">
        Page {currentPage} sur {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage >= totalPages || isLoading}
      >
        Suivant
        <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

export { Pagination };
```

**Rules**:

- Uses `useQueryState` (single param) not `useQueryStates`
- Imports `parseAsPage` from `@/lib/parsers/nuqs`
- Hides when `totalPages <= 1`
- Disables buttons at boundaries

## Nuqs Options (P0)

| Option            | Value   | Reason                                      |
| ----------------- | ------- | ------------------------------------------- |
| `shallow`         | `false` | Server re-fetches data on filter change     |
| `history`         | `push`  | Back button navigates through filter states |
| `startTransition` | Used    | Shows loading state during server re-render |
| `withDefault()`   | Always  | Prevents null values, ensures type safety   |

## Security Validation (P0)

Defense in depth: validate at EVERY layer.

| Layer             | Protection                      | Implementation                        |
| ----------------- | ------------------------------- | ------------------------------------- |
| Parser level      | Bounds, length, enum validation | `createParser`, `withDefault`         |
| Schema level      | Zod form validation             | `FilterUsersSchema`                   |
| Server data fetch | Re-validate all params          | Type guards, `.slice()`, `Math.min()` |
| Prisma level      | Parameterized queries           | Automatic                             |
| React level       | XSS prevention                  | Auto-escaping                         |

| Attack Vector      | Protection                                     |
| ------------------ | ---------------------------------------------- |
| SQL Injection      | Prisma parameterized queries                   |
| XSS via search     | React auto-escapes                             |
| Invalid enum value | `parseAsStringLiteral` rejects                 |
| Negative page      | `createParser` with min(1)                     |
| Huge page number   | `createParser` with max(1000)                  |
| Long search string | `parseAsSafeSearch` truncates                  |
| Missing params     | `withDefault()`                                |
| Invalid sortBy     | Server validates against `usersSortableFields` |

## SEO Configuration (P1)

- Public pages: Define canonical, handle pagination SEO
- Protected pages: Set `robots: { index: false, follow: false }`
- Index pages 1-10 only for public pages

## Anti-Patterns

```tsx
// ❌ Wrong: Parsers defined inline in page file
// Parsers MUST be in lib/parsers/nuqs.ts
export const projectSearchParams = {
  page: createParser({ ... }).withDefault(1),
};

// ❌ Wrong: Enums defined in schema, imported by constants
// Enums MUST be in constants, imported by schema
// lib/schemas/search/users-filters.schema.ts
const userRoleFilters = ["all", "ADMIN", "CUSTOMER"] as const; // ❌ Should be in constants

// ❌ Wrong: Parsers re-exporting constants
// lib/parsers/nuqs.ts
export const MAX_PAGE = PAGINATION.maxPage; // ❌ Consumers import from query.constant.ts

// ❌ Wrong: parseAsSafeSearch rejecting long strings
parse(query) {
  if (!query || query.length > MAX_SEARCH_LENGTH) {
    return ""; // ❌ Rejects. Should truncate with .slice()
  }
}

// ❌ Wrong: Client-side sorting in DataTable
useReactTable({
  getSortedRowModel: getSortedRowModel(), // ❌ Server handles sorting
  getFilteredRowModel: getFilteredRowModel(), // ❌ Server handles filtering
  getPaginationRowModel: getPaginationRowModel(), // ❌ Server handles pagination
});

// ❌ Wrong: Not using useTransition
const [filters, setFilters] = useQueryStates(parsers, { shallow: false });
// ❌ No loading feedback

// ❌ Wrong: shallow: true
useQueryStates(parsers, { shallow: true }); // ❌ Server won't re-fetch

// ❌ Wrong: history: "replace"
useQueryStates(parsers, { history: "replace" }); // ❌ Breaks back button

// ❌ Wrong: Not resetting page when filters change
setFilters({ role: value }); // ❌ Missing page: 1

// ❌ Wrong: Using empty string instead of null to clear
setFilters({ search: "" }); // ❌ Use null

// ❌ Wrong: Trusting parsed values without server-side re-validation
const { page } = await loadSearchParams(searchParams);
prisma.findMany({ skip: (page - 1) * PAGE_SIZE }); // ❌ Must re-validate

// ❌ Wrong: findMany without select or take
prisma.user.findMany({ where: whereClause }); // ❌ Must use select + take

// ❌ Wrong: Sequential count + findMany
const users = await prisma.user.findMany({ ... });
const totalCount = await prisma.user.count({ ... }); // ❌ Use $transaction

// ❌ Wrong: 2-state sort toggle (no reset)
function handleSort() {
  const nextOrder = isActive && filters.order === "asc" ? "desc" : "asc";
  setFilters({ sortBy: field, order: nextOrder }); // ❌ No reset path
}

// ❌ Wrong: Data fetching imports constants from parsers
import { MAX_PAGE } from "@/lib/parsers/nuqs"; // ❌ Import from query.constant.ts
```

## Key Principles

1. **Single source of truth**: Prisma → Constants → Parsers → Domain Config → Schema → Components
2. **Domino effect**: Changing one layer propagates automatically to downstream layers
3. **Defense in depth**: Validate at parser, schema, AND server levels
4. **Server-side everything**: Sort, filter, paginate on server — DataTable is a dumb renderer
5. **3-state sort toggle**: `unsorted → asc → desc → reset` (never 2-state)
6. **`useTransition` everywhere**: All URL mutations use `startTransition` for loading feedback
7. **Enums in constants**: Defined in `{entity}-filters.constant.ts`, imported by schemas
8. **Parsers don't re-export**: Consumers import constants directly from `query.constant.ts`
9. **Truncate, don't reject**: `parseAsSafeSearch` uses `.slice()` not conditional rejection
10. **`null` to clear**: Remove params from URL with `null`, not empty strings
11. **`select` + `take` always**: Every Prisma `findMany` must have both
12. **`$transaction` for parallel**: Count + findMany in a single transaction
