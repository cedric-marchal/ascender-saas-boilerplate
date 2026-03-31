---
paths:
  - "features/*/constants/*-filters*"
  - "features/*/schemas/*-filter*"
  - "features/*/components/*-filters*"
  - "features/*/components/*-columns*"
  - "lib/parsers/*"
  - "components/pagination*"
  - "components/page-size*"
---

# Filter, Search, Sort & Pagination Rules

## Import Rule (CRITICAL)

Two separate files for two separate concerns:

| File                     | Contains                                                                                          | Who imports it                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/parsers/filters.ts` | Pure constants & types (`PAGE_SIZE.SMALL`, `SortOrder`, `MAX_SEARCH_LENGTH`, etc.)                | Services, schemas, tests — anything that needs pagination/filter values without Nuqs |
| `lib/parsers/nuqs.ts`    | Nuqs parsers only (`parseAsPage`, `createEnumParser`, etc.) — imports constants from `filters.ts` | Constants files (searchParams config), components, pages                             |

**NEVER import from `nuqs.ts` in services or schemas.** Services MUST import from `filters.ts` to stay decoupled from Nuqs.

### When to use Nuqs vs plain filters

| Scenario                                         | Nuqs? | Why                                                           |
| ------------------------------------------------ | ----- | ------------------------------------------------------------- |
| Page with URL filters/sort/pagination            | Yes   | State lives in the URL (bookmarkable, shareable, back button) |
| Page with multiple independent lists             | No    | Query param conflicts between lists                           |
| Cron, action, or service calling another service | No    | No URL involved                                               |
| Page with a single list, no user-facing filters  | No    | Nothing to put in the URL                                     |

**The service doesn't care.** It receives a plain TypeScript object. The page decides whether that object comes from Nuqs or is built manually.

## Architecture

```
lib/parsers/filters.ts            ← pure constants & types (zero dependencies)
lib/parsers/nuqs.ts               ← Nuqs parsers (imports from filters.ts)
features/*/constants/              ← domain config (types, labels, searchParams)
features/*/schemas/                ← Zod validation (imports limits from filters.ts)
features/*/services/               ← server data fetch (imports from filters.ts)
features/*/components/             ← client UI (imports parsers from nuqs.ts)
app/*/page.tsx                     ← thin shim (createLoader from nuqs.ts OR manual object)
```

## lib/parsers/filters.ts — Pure Constants

Zero dependencies. Importable anywhere.

Key exports:

- `PAGE_SIZE` object: `{ SMALL: 10, MEDIUM: 20, LARGE: 50, XLARGE: 100 }`
- `PAGE_SIZES` array, `PAGE_SIZE.SMALL` → `PAGE_SIZE.SMALL`
- `SORT_ORDERS`, types `SortOrder`, `PageSize`
- `MAX_PAGE` (1000), `MAX_SEARCH_LENGTH` (100), `MAX_ARRAY_LENGTH` (50)

## lib/parsers/nuqs.ts — Nuqs Parsers Only

Imports constants from `filters.ts`. Exports only Nuqs-specific parsers:

- `parseAsPage`, `parseAsSafeSearch`, `parseAsPageSize`, `parseAsOrder`
- `createEnumParser()`, `createSortByParser()`

Rules:

- `parseAsSafeSearch` MUST truncate (`.slice()`), never reject
- `parseAsPage` MUST clamp between 1 and `MAX_PAGE`
- `parseAsPageSize` MUST fallback to `PAGE_SIZE.SMALL` on invalid input

## Domain Configuration

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

## Validation Schema

`features/*/schemas/{entity}-filters.schema.ts`

- IMPORTS enum arrays from feature constants (never defines them)
- IMPORTS limits from `@/lib/parsers/filters` (NOT nuqs)
- Validates form fields only (NOT `sortBy`/`order`/`page` — parsers handle those)

## Service

- `import "server-only"` at top
- Imports `PAGE_SIZE.SMALL`, `type SortOrder` from `@/lib/parsers/filters`
- `$transaction` for parallel `findMany` + `count`
- Always `select` + `take`
- Dynamic orderBy: `{ [filters.sortBy]: filters.order }`
- Use type guards from constants (e.g., `isUserRole()`)
- NO re-validation — parsers or caller already validate all values

## Server Page

### With Nuqs (URL-driven filters)

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

### Without Nuqs (manual filters)

```tsx
import { getActivity } from "@/features/activity/services/get-activity.service";
import { getProjects } from "@/features/projects/services/get-projects.service";

export default async function DashboardRoute() {
  const session = await requireCustomer();

  const [projects, activity] = await Promise.all([
    getProjects({
      userId: session.user.id,
      page: 1,
      sortBy: "createdAt",
      order: "desc",
    }),
    getActivity({
      userId: session.user.id,
      page: 1,
      sortBy: "createdAt",
      order: "desc",
    }),
  ]);

  return (
    <Main>
      <ProjectsList projects={projects} />
      <ActivityList activity={activity} />
    </Main>
  );
}
```

## Client Components

### Filter Component

Uses TanStack Form + Zod + `useQueryStates`. On submit, pushes filters to URL with `page: 1` reset. See existing implementations in `features/*/components/*-filters.tsx`.

Key rules:

- `useTransition` + `shallow: false` + `history: "push"`
- Reset `page: 1` on every filter change
- Use `null` to clear params (not empty string)

### SortableHeader in Columns

3-state toggle: `unsorted → asc → desc → reset`

- Reset sets `sortBy: null, order: null`
- `field` MUST match value in `{entity}SortableFields`

### DataTable (Dumb Renderer)

ONLY `getCoreRowModel()` — NO `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`.

### Pagination

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
Services importing from lib/parsers/nuqs.ts → MUST import from lib/parsers/filters.ts
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
