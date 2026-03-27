---
paths:
  - "features/*/constants/*-filters*"
  - "features/*/schemas/*-filter*"
  - "features/*/components/*-filters*"
  - "features/*/components/*-columns*"
  - "lib/parsers/nuqs*"
  - "components/pagination*"
  - "components/page-size*"
---

# Filter, Search, Sort & Pagination Rules

## 6-Layer Architecture

```
Prisma Schema (enums) → lib/generated/prisma/client
  → lib/parsers/nuqs.ts → features/*/constants/{entity}-filters.constant.ts
  → features/*/schemas/ → features/*/services/ → features/*/components/ → app/*/page.tsx
```

| Layer | File                                                | Responsibility                                   |
| ----- | --------------------------------------------------- | ------------------------------------------------ |
| 1     | `lib/parsers/nuqs.ts`                               | Global constants + universal parsers             |
| 2     | `features/*/constants/{entity}-filters.constant.ts` | Domain config (searchParams, guards, labels)     |
| 3     | `features/*/schemas/{entity}-filters.schema.ts`     | Zod validation (imports from constants)          |
| 4     | `features/*/services/get-{entity}.service.ts`       | Server data fetch (`"server-only"`)              |
| 5     | `app/*/page.tsx`                                    | Server Component (`createLoader(searchParams)`)  |
| 6     | `features/*/components/`                            | Client components (filters, columns, pagination) |

## Layer 1: Global Constants + Parsers

`lib/parsers/nuqs.ts` — ALL query constants and parsers centralized here.

Key exports:

- `PAGE_SIZE` object: `{ SMALL: 10, MEDIUM: 20, LARGE: 50, XLARGE: 100 }`
- `PAGE_SIZES` array, `DEFAULT_PAGE_SIZE` → `PAGE_SIZE.SMALL`
- `SORT_ORDERS`, `DEFAULT_SORT_ORDER`, `DEFAULT_SORT_BY`
- `MAX_PAGE` (1000), `MAX_SEARCH_LENGTH` (100)
- Parsers: `parseAsPage`, `parseAsSafeSearch`, `parseAsPageSize`, `parseAsOrder`
- Factories: `createEnumParser()`, `createSortByParser()`

Rules:

- `parseAsSafeSearch` MUST truncate (`.slice()`), never reject
- `parseAsPage` MUST clamp between 1 and `MAX_PAGE`
- `parseAsPageSize` MUST fallback to `PAGE_SIZE.SMALL` on invalid input

## Layer 2: Domain Configuration

`features/{feature}/constants/{entity}-filters.constant.ts`

```tsx
import { UserRole } from "@/lib/generated/prisma/browser";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type UserRoleFilter = "all" | UserRole;
const userRoleFilters = ["all", UserRole.ADMIN, UserRole.CUSTOMER] as const;
const usersSortableFields = ["name", "email", "createdAt"] as const;

const roleLabels: Record<UserRoleFilter, string> = {
  all: "Tous les rôles",
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.CUSTOMER]: "Client",
};

const usersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: createEnumParser(userRoleFilters).withDefault("all"),
  sortBy: createSortByParser(usersSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

function isUserRole(value: string): value is UserRole {
  return value === UserRole.ADMIN || value === UserRole.CUSTOMER;
}
```

Rules:

- Enum arrays MUST use `as const`
- `searchParams` MUST include `sortBy`, `order`, `page`
- Type guards defined here for server validation
- Labels: `Record<Enum, string>` (French UI strings)

## Layer 3: Validation Schema

`features/*/schemas/{entity}-filters.schema.ts`

- IMPORTS enum arrays from feature constants (never defines them)
- IMPORTS limits from `@/lib/parsers/nuqs`
- Validates form fields only (NOT `sortBy`/`order`/`page` — parsers handle those)

## Layer 4: Service

- `import "server-only"` at top
- `$transaction` for parallel `findMany` + `count`
- Always `select` + `take`
- Dynamic orderBy: `{ [filters.sortBy]: filters.order }`
- Use type guards from constants (e.g., `isUserRole()`)
- NO re-validation — nuqs parsers already validate all values

## Layer 5: Server Page

```tsx
import { createLoader, type SearchParams } from "nuqs/server";

import { usersSearchParams } from "@/features/users/constants/users-filters.constant";
import { getUsers } from "@/features/users/services/get-users.service";

const loadSearchParams = createLoader(usersSearchParams);

export default async function AdminUsersRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await loadSearchParams(searchParams);

  const { users, totalCount, totalPages, currentPage } =
    await getUsers(filters);

  return (
    <Main>
      <UsersFilters />
      <DataTable columns={usersColumns} data={users} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </Main>
  );
}
```

- `createLoader(searchParams)` is the ONLY place parsers connect to page
- Page does NOT re-validate
- DataTable receives raw data (no client-side sort/filter/pagination)

## Layer 6: Client Components

### 6a. Filter Component

Uses TanStack Form + Zod + `useQueryStates`. On submit, pushes filters to URL with `page: 1` reset. See existing implementations in `features/*/components/*-filters.tsx`.

Key rules:

- `useTransition` + `shallow: false` + `history: "push"`
- Reset `page: 1` on every filter change
- Use `null` to clear params (not empty string)

### 6b. SortableHeader in Columns

3-state toggle: `unsorted → asc → desc → reset`

- Reset sets `sortBy: null, order: null`
- `field` MUST match value in `{entity}SortableFields`

### 6c. DataTable (Dumb Renderer)

ONLY `getCoreRowModel()` — NO `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`.

### 6d. Pagination

Uses `useQueryState("page", parseAsPage)`. Hides when `totalPages <= 1`. See `components/pagination.tsx`.

## Nuqs Options (ALWAYS)

| Option            | Value   | Reason                 |
| ----------------- | ------- | ---------------------- |
| `shallow`         | `false` | Server re-fetches data |
| `history`         | `push`  | Back button works      |
| `startTransition` | Used    | Shows loading state    |
| `withDefault()`   | Always  | Prevents null          |

## Anti-Patterns

```
Parsers inline in page file → MUST be in lib/parsers/nuqs.ts
Enums defined in schema → MUST be in constants
parseAsSafeSearch rejecting → MUST truncate with .slice()
Client-side sorting → getSortedRowModel(), getFilteredRowModel()
Missing useTransition → no loading feedback
shallow: true → server won't re-fetch
history: "replace" → breaks back button
Not resetting page on filter change
Empty string to clear → use null
findMany without select+take
Sequential count+findMany → use $transaction
2-state sort → MUST be 3-state
```
