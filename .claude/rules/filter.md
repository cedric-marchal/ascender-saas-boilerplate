# Nuqs Filters Creation Rules

## Context

These rules apply exclusively to creating URL-based filters and pagination using nuqs in Next.js App Router. Filters sync React state with URL query parameters for SEO-friendly, shareable, and bookmarkable filtered pages.

## Rules

### 1. File Structure (P0)

- Parsers MUST be defined in the page file and exported for reuse
- Filter components MUST be in `_components/` folder
- Filter components MUST use the `-filters.tsx` suffix

```
app/(public)/projects/
├── page.tsx                              # Parsers + Server Component
├── loading.tsx                           # Loading state
├── _components/
│   ├── project-filters.tsx               # Client Component (filters UI)
│   ├── project-list.tsx                  # Server Component (list)
│   ├── project-card.tsx                  # Server Component (card)
│   ├── project-list-empty.tsx            # Server Component (empty state)
│   └── project-pagination.tsx            # Client Component (pagination)
```

### 2. Parser Definitions (P0)

- ALWAYS use `createParser` for custom validation (page, search)
- ALWAYS use `parseAsStringLiteral` for enum values
- ALWAYS use `withDefault()` to avoid null values
- ALWAYS validate min/max bounds for integers
- ALWAYS limit string length for search inputs
- Parsers MUST be exported from page file for client component reuse

```tsx
import { createLoader, createParser, parseAsStringLiteral } from "nuqs/server";

const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return "";
    }
    return query.trim();
  },
  serialize(value) {
    return value;
  },
});

const projectStatuses = ["all", "active", "completed", "archived"] as const;

export const projectSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  status: parseAsStringLiteral(projectStatuses).withDefault("all"),
  page: parseAsPage.withDefault(1),
};

const loadSearchParams = createLoader(projectSearchParams);
```

### 3. Server Component Page (P0)

- ALWAYS use `createLoader` to parse searchParams server-side
- ALWAYS re-validate values before Prisma queries (defense in depth)
- ALWAYS use `prisma.$transaction` for parallel count + findMany
- ALWAYS use `select` to specify returned fields
- ALWAYS handle edge cases (page > totalPages)

```tsx
import type { Metadata } from "next";

import {
  type SearchParams,
  createLoader,
  createParser,
  parseAsStringLiteral,
} from "nuqs/server";

import { prisma } from "@/lib/prisma";

import { ProjectFilters } from "@/app/(public)/projects/_components/project-filters";
import { ProjectList } from "@/app/(public)/projects/_components/project-list";

const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;
const PAGE_SIZE = 12;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return "";
    }
    return query.trim();
  },
  serialize(value) {
    return value;
  },
});

const projectStatuses = ["all", "active", "completed", "archived"] as const;

export const projectSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  status: parseAsStringLiteral(projectStatuses).withDefault("all"),
  page: parseAsPage.withDefault(1),
};

const loadSearchParams = createLoader(projectSearchParams);

export const metadata: Metadata = {
  title: "Projets - Mon App",
  description: "Découvrez tous nos projets en cours et terminés.",
  alternates: {
    canonical: "/projects",
  },
};

type ProjectsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const { search, status, page } = await loadSearchParams(searchParams);

  const safeSearch = search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(page, MAX_PAGE));
  const safeStatus = projectStatuses.includes(status) ? status : "all";

  const whereClause = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { description: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
    ...(safeStatus !== "all" && { status: safeStatus }),
  };

  const [projects, totalCount] = await prisma.$transaction([
    prisma.project.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        imageUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.project.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Projets</h1>
        <p className="mt-2 text-gray-600">
          {totalCount} projet{totalCount > 1 ? "s" : ""} trouvé
          {totalCount > 1 ? "s" : ""}
        </p>
      </header>

      <ProjectFilters />

      <ProjectList
        projects={projects}
        currentPage={safePage}
        totalPages={totalPages}
      />
    </main>
  );
}
```

### 4. Search Input Debounce (P0)

- MUST use debounce for search inputs that trigger database queries
- MUST use a custom `useDebounce` hook with 500ms delay (default)
- Prevents database overload from rapid typing
- Improves UX by reducing unnecessary queries

Create a reusable hook at `@/hooks/use-debounce.ts`:

```tsx
import { useEffect, useState } from "react";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export { useDebounce };
```

### 5. Client Component Filters (P0)

- MUST be a Client Component (`"use client"`)
- MUST use `useQueryStates` for multiple filters
- MUST use `useTransition` for loading state
- MUST use `useDebounce` for search inputs (500ms delay)
- MUST set `shallow: false` to notify server
- MUST set `history: "push"` for back button support
- MUST reset page to 1 when filters change
- MUST type event handlers correctly with `import type`
- MUST use `null` to remove params from URL (not empty string)

```tsx
"use client";

import { type ChangeEvent, useState, useTransition } from "react";

import { Search, X } from "lucide-react";
import { createParser, parseAsStringLiteral, useQueryStates } from "nuqs";

import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_PAGE = 1000;
const MAX_SEARCH_LENGTH = 100;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return "";
    }
    return query.trim();
  },
  serialize(value) {
    return value;
  },
});

const projectStatuses = ["all", "active", "completed", "archived"] as const;

type ProjectStatus = (typeof projectStatuses)[number];

const statusLabels: Record<ProjectStatus, string> = {
  all: "Tous les statuts",
  active: "En cours",
  completed: "Terminé",
  archived: "Archivé",
};

function ProjectFilters() {
  const [isLoading, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsSafeSearch.withDefault(""),
      status: parseAsStringLiteral(projectStatuses).withDefault("all"),
      page: parseAsPage.withDefault(1),
    },
    {
      shallow: false,
      startTransition,
      history: "push",
    }
  );

  // Update URL when debounced search changes
  React.useEffect(() => {
    setFilters({
      search: debouncedSearch || null,
      page: 1,
    });
  }, [debouncedSearch, setFilters]);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchInput(event.target.value);
  }

  function handleStatusChange(value: ProjectStatus) {
    setFilters({
      status: value === "all" ? null : value,
      page: 1,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setFilters({
      search: null,
      status: null,
      page: null,
    });
  }

  const hasActiveFilters = filters.search || filters.status !== "all";

  return (
    <section className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Rechercher un projet..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {projectStatuses.map((status: ProjectStatus) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Effacer
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          Chargement...
        </div>
      )}
    </section>
  );
}

export { ProjectFilters };
```

### 5. Pagination Component (P0)

- MUST use `useQueryState` for single page param
- MUST disable buttons at boundaries
- MUST show loading state during transition

```tsx
"use client";

import { useTransition } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { createParser, useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";

const MAX_PAGE = 1000;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, MAX_PAGE);
  },
  serialize(value) {
    return String(value);
  },
});

type ProjectPaginationProps = {
  currentPage: number;
  totalPages: number;
};

function ProjectPagination({
  currentPage,
  totalPages,
}: ProjectPaginationProps) {
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

export { ProjectPagination };
```

### 6. SEO Configuration (P1)

- Public pages: Define canonical, handle pagination SEO
- Protected pages: Set `robots: { index: false, follow: false }`
- Use `generateMetadata` for dynamic SEO based on filters

```tsx
import type { Metadata } from "next";

import {
  type SearchParams,
  createLoader,
  createParser,
  parseAsStringLiteral,
} from "nuqs/server";

import { env } from "@/lib/env";

const projectStatuses = ["all", "active", "completed", "archived"] as const;

const parseAsPage = createParser({
  parse(query) {
    const parsed = parseInt(query, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.min(parsed, 1000);
  },
  serialize(value) {
    return String(value);
  },
});

export const projectSearchParams = {
  status: parseAsStringLiteral(projectStatuses).withDefault("all"),
  page: parseAsPage.withDefault(1),
};

const loadSearchParams = createLoader(projectSearchParams);

type ProjectsPageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  searchParams,
}: ProjectsPageProps): Promise<Metadata> {
  const { status, page } = await loadSearchParams(searchParams);

  const baseUrl = env.NEXT_PUBLIC_BASE_URL;
  const hasFilters = status !== "all" || page > 1;

  const title =
    status !== "all"
      ? `Projets ${status} - Page ${page}`
      : page > 1
        ? `Projets - Page ${page}`
        : "Projets";

  return {
    title,
    description: "Découvrez tous nos projets en cours et terminés.",
    alternates: {
      canonical: hasFilters ? undefined : "/projects",
    },
    robots: {
      index: page <= 10,
      follow: true,
    },
    other: {
      ...(page > 1 && { "link-prev": `${baseUrl}/projects?page=${page - 1}` }),
      "link-next": `${baseUrl}/projects?page=${page + 1}`,
    },
  };
}
```

### 7. Options Configuration (P0)

| Option            | Value   | Reason                                      |
| ----------------- | ------- | ------------------------------------------- |
| `shallow`         | `false` | Server re-fetches data on filter change     |
| `history`         | `push`  | Back button navigates through filter states |
| `startTransition` | Used    | Shows loading state during server re-render |
| `withDefault()`   | Always  | Prevents null values, ensures type safety   |

### 8. Security Validation (P0)

| Attack Vector      | Protection                     | Implementation |
| ------------------ | ------------------------------ | -------------- |
| SQL Injection      | Prisma parameterized queries   | Automatic      |
| XSS via search     | React auto-escapes             | Automatic      |
| Invalid enum value | `parseAsStringLiteral` rejects | Parser level   |
| Negative page      | `createParser` with min(1)     | Parser level   |
| Huge page number   | `createParser` with max(1000)  | Parser level   |
| Long search string | `createParser` with slice(100) | Parser level   |
| Missing params     | `withDefault()`                | Parser level   |
| Page > totalPages  | Server-side check              | Page component |

## Available Parsers

| Parser                 | Usage                                 | Example                                     |
| ---------------------- | ------------------------------------- | ------------------------------------------- |
| `parseAsString`        | Basic string                          | `parseAsString.withDefault("")`             |
| `parseAsInteger`       | Integer (use createParser for bounds) | `parseAsInteger.withDefault(1)`             |
| `parseAsFloat`         | Float number                          | `parseAsFloat.withDefault(0)`               |
| `parseAsBoolean`       | Boolean                               | `parseAsBoolean.withDefault(false)`         |
| `parseAsStringLiteral` | Enum values                           | `parseAsStringLiteral(["a", "b"] as const)` |
| `parseAsNumberLiteral` | Number enum                           | `parseAsNumberLiteral([1, 2, 3] as const)`  |
| `parseAsArrayOf`       | Comma-separated array                 | `parseAsArrayOf(parseAsInteger)`            |
| `parseAsIsoDate`       | Date (YYYY-MM-DD)                     | `parseAsIsoDate`                            |
| `parseAsIsoDateTime`   | DateTime                              | `parseAsIsoDateTime`                        |
| `parseAsTimestamp`     | Timestamp (ms)                        | `parseAsTimestamp`                          |
| `createParser`         | Custom validation                     | See examples above                          |

## Anti-Patterns

```tsx
// ❌ Wrong: Using parseAsInteger without bounds
const page = parseAsInteger.withDefault(1);

// ❌ Wrong: Using parseAsString without length limit for search
const search = parseAsString.withDefault("");

// ❌ Wrong: Not using debounce for search inputs (overloads database)
function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
  setFilters({ search: event.target.value, page: 1 });
}

// ❌ Wrong: shallow: true (server won't re-fetch)
useQueryStates(parsers, { shallow: true });

// ❌ Wrong: history: "replace" for main filters (breaks back button)
useQueryStates(parsers, { history: "replace" });

// ❌ Wrong: Not resetting page when filters change
function handleStatusChange(value: string) {
  setFilters({ status: value });
}

// ❌ Wrong: Using empty string instead of null to clear
setFilters({ search: "" });

// ❌ Wrong: Not using useTransition (no loading state)
const [filters, setFilters] = useQueryStates(parsers, { shallow: false });

// ❌ Wrong: Not typing event handlers
function handleChange(event) {
  setFilters({ search: event.target.value });
}

// ❌ Wrong: Trusting parsed values without server-side re-validation
const { page } = await loadSearchParams(searchParams);
prisma.project.findMany({ skip: (page - 1) * PAGE_SIZE });

// ❌ Wrong: Not using $transaction for count + findMany
const projects = await prisma.project.findMany({ ... });
const totalCount = await prisma.project.count({ ... });

// ❌ Wrong: Not using select in Prisma queries
prisma.project.findMany({ where: whereClause });
```

## Key Principles

1. **Defense in depth**: Validate at parser level AND server level
2. **Type safety**: Always type event handlers with `import type`
3. **SEO friendly**: `shallow: false` + `history: "push"` + canonical URLs
4. **Performance**: `$transaction` for parallel queries, `select` for fields, `useDebounce` for search
5. **Database protection**: Always debounce search inputs (500ms) to prevent query overload
6. **UX**: `useTransition` for loading states, reset page on filter change
7. **Clean URLs**: Use `null` to remove params, not empty strings
8. **Bounds validation**: Always limit page numbers and string lengths
9. **Consistent parsers**: Same parser definitions in page and components

```

```
