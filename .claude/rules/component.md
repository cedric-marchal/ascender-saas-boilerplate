# Component Creation Rules

## Context

These rules apply exclusively to creating new React components (`.tsx` files) in the Next.js App Router structure. Components are the building blocks of pages and must follow strict conventions for consistency, maintainability, and SEO.

## Rules

### 1. File Naming (P0)

- Component files MUST use kebab-case: `my-component.tsx`
- NEVER use PascalCase for file names: ~~`MyComponent.tsx`~~
- MUST use appropriate suffix based on component type (see Naming Conventions)

```bash
# ✅ Correct
user-card.tsx
dashboard-stats.tsx
blog-post-preview.tsx

# ❌ Wrong
UserCard.tsx
DashboardStats.tsx
BlogPostPreview.tsx
```

### 2. Naming Conventions by Component Type (P0)

| Suffix          | Usage                              | Example                     |
| --------------- | ---------------------------------- | --------------------------- |
| `-card.tsx`     | Displays ONE resource              | `project-card.tsx`          |
| `-list.tsx`     | Maps over cards                    | `project-list.tsx`          |
| `-table.tsx`    | Data table component               | `users-table.tsx`           |
| `-columns.tsx`  | Table column definitions           | `users-columns.tsx`         |
| `-row.tsx`      | Single table row component         | `user-row.tsx`              |
| `-form.tsx`     | Form component                     | `profile-form.tsx`          |
| `-modal.tsx`    | Dialog/Modal                       | `delete-account-modal.tsx`  |
| `-button.tsx`   | Button with specific logic         | `sign-out-button.tsx`       |
| `-header.tsx`   | Section/page header                | `settings-header.tsx`       |
| `-tabs.tsx`     | Tab navigation                     | `settings-tabs.tsx`         |
| `-filters.tsx`  | Filters (Nuqs)                     | `project-filters.tsx`       |
| `-skeleton.tsx` | Loading state                      | `project-card-skeleton.tsx` |
| `-empty.tsx`    | Empty state (ALWAYS separate file) | `project-list-empty.tsx`    |
| `-error.tsx`    | Error state                        | `project-list-error.tsx`    |

### 3. Component Structure (P0)

- Follow this exact order: Imports → Type Declaration (if needed) → Function Declaration → Export
- MUST use named export at the end of the file
- NEVER use default export
- Only ONE component per file

```tsx
// ✅ Correct structure
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MyComponentProps = {
  title: string;
  children: ReactNode;
};

function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export { MyComponent };
```

```tsx
// ❌ Wrong: default export
export default function MyComponent() { ... }

// ❌ Wrong: inline export
export function MyComponent() { ... }

// ❌ Wrong: multiple components in one file
function ComponentA() { ... }
function ComponentB() { ... }
export { ComponentA, ComponentB };
```

### 4. Import Paths (P0)

- ALWAYS use absolute paths with `@/` prefix
- NEVER use relative paths (`./` or `../`)

```tsx
// ✅ Correct
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { JobCard, type Job } from "@/app/(public)/jobs/_components/job-card";

import { Button } from "../../components/ui/button";
// ❌ Wrong
import { JobCard } from "./job-card";
```

### 5. Props Typing (P0)

- ALWAYS use `type` keyword for props (never `interface`)
- Props type MUST be named `{ComponentName}Props`
- For 2 or fewer props: inline type in function signature
- For more than 2 props: separate type declaration
- Component-specific types CAN be co-located and exported from the component file

```tsx
// ✅ Correct: 2 or fewer props (inline)
function UserAvatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} />;
}

export { UserAvatar };
```

```tsx
// ✅ Correct: more than 2 props (separate type)
type UserCardProps = {
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
};

function UserCard({ name, email, avatarUrl, role }: UserCardProps) {
  return (
    <article>
      <img src={avatarUrl} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
      {role && <span>{role}</span>}
    </article>
  );
}

export { UserCard };
```

```tsx
// ✅ Correct: component-specific type co-located and exported
import type { Job as PrismaJob } from "@prisma/client";

export type Job = Pick
  PrismaJob,
  "id" | "title" | "company" | "location"
>;

type JobCardProps = {
  job: Job;
};

function JobCard({ job }: JobCardProps) {
  return <article>{job.title}</article>;
}

export { JobCard };
```

### 6. Type Imports (P0)

- ALWAYS combine imports from the same module (never separate them)
- Use `import type {}` when importing ONLY types
- Use inline `type` keyword when mixing types and values
- NEVER have multiple import statements from the same module

```tsx
// ✅ Correct: Type-only imports
import type { ReactNode } from "react";
import type { User } from "@/types/user";

// ✅ Correct: Mixed imports (types + values)
import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  CreateUserSchema,
  type CreateUserSchemaType,
} from "@/lib/schemas/user.schema";

// ❌ Wrong: Separate imports from the same module
import type { ReactNode } from "react";
import { useState } from "react";  // Should be combined above

// ❌ Wrong: Not using inline `type` keyword
import { ReactNode, useState } from "react";  // ReactNode should have `type` prefix
```

### 7. Server vs Client Components (P0)

- Components MUST be Server Components by default
- Use `"use client"` ONLY when strictly necessary for:
  - Event handlers (`onClick`, `onChange`, etc.)
  - React hooks (`useState`, `useEffect`, etc.)
  - Browser APIs (`window`, `document`, etc.)

```tsx
// ✅ Correct: Server Component (default, no directive needed)
function StaticCard({ title }: { title: string }) {
  return <article>{title}</article>;
}

export { StaticCard };
```

```tsx
// ✅ Correct: Client Component (only when necessary)
"use client";

import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setCount((currentCount) => currentCount + 1)}
    >
      {count}
    </button>
  );
}

export { Counter };
```

### 8. Button Elements (P0)

- ALWAYS add `type="button"` on `<button>` elements
- Exception: submit buttons in forms use `type="submit"`

```tsx
// ✅ Correct
<button type="button" onClick={handleClick}>
  Click me
</button>

<button type="submit">
  Submit form
</button>

// ❌ Wrong: missing type attribute
<button onClick={handleClick}>
  Click me
</button>
```

### 9. Styling with Tailwind CSS (P1)

- ALWAYS use `cn()` from `@/lib/utils` for conditional classes
- NEVER use string concatenation or template literals for classes
- Components MUST be responsive (desktop, tablet, mobile)

```tsx
// ✅ Correct
import { cn } from "@/lib/utils";

type ButtonProps = {
  variant?: "primary" | "secondary";
  isDisabled?: boolean;
  className?: string;
};

function Button({ variant = "primary", isDisabled, className }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "rounded-md px-4 py-2 font-medium transition-colors",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" &&
          "bg-gray-200 text-gray-800 hover:bg-gray-300",
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      Click me
    </button>
  );
}

export { Button };
```

```tsx
// ❌ Wrong: string concatenation
className={`rounded-md ${variant === "primary" ? "bg-blue-600" : "bg-gray-200"}`}

// ❌ Wrong: template literal
className={`rounded-md ${isDisabled && "opacity-50"}`}
```

### 10. SEO & Accessibility (P1)

- Use semantic HTML elements (`<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`, etc.)
- Use proper heading hierarchy (`h1` → `h2` → `h3`)
- Add `aria-hidden="true"` on decorative icons (icons accompanied by text)
- Add `aria-label` on icon-only buttons (icons without text)

```tsx
// ✅ Correct: decorative icon (text provides meaning)
<div className="flex items-center gap-2">
  <MapPin className="h-4 w-4" aria-hidden="true" />
  <span>Paris, France</span>
</div>

// ✅ Correct: icon-only button (aria-label provides meaning)
<button type="button" aria-label="Fermer le modal">
  <X className="h-4 w-4" />
</button>

// ❌ Wrong: decorative icon without aria-hidden
<div className="flex items-center gap-2">
  <MapPin className="h-4 w-4" />
  <span>Paris, France</span>
</div>

// ❌ Wrong: icon-only button without aria-label
<button type="button">
  <X className="h-4 w-4" />
</button>
```

### 11. Iterating with map() (P1)

- ALWAYS use explicit type annotation in `.map()` callback for readability
- ALWAYS use `index: number` (not `i` or `_`) when index is needed

```tsx
// ✅ Correct: explicit type
{jobs.map((job: Job) => (
  <JobCard key={job.id} job={job} />
))}

// ✅ Correct: with index
{items.map((item: Item, index: number) => (
  <div key={index}>{item.name}</div>
))}

// ❌ Wrong: implicit type
{jobs.map((job) => (
  <JobCard key={job.id} job={job} />
))}

// ❌ Wrong: abbreviated index
{items.map((item, i) => ...)}
{items.map((_, idx) => ...)}
```

## Component Location Rules

### Directory Structure

```
├── components/                    # Global components (emails, ui, shared)
│   ├── ui/                        # Shadcn/ui components
│   ├── emails/                    # Email templates
│   └── [other-global]/            # Other global components
├── app/
│   ├── (public)/
│   │   ├── _components/           # Shared across ALL public pages
│   │   ├── blog/
│   │   │   ├── _components/       # Blog-specific components
│   │   │   └── page.tsx
│   │   └── contact/
│   │       ├── _components/       # Contact-specific components
│   │       └── page.tsx
│   └── (protected)/
│       ├── _components/           # Shared across ALL protected pages
│       ├── dashboard/
│       │   ├── _components/       # Dashboard-specific components
│       │   ├── settings/
│       │   │   ├── _components/   # Settings-specific components
│       │   │   └── page.tsx
│       │   └── page.tsx
│       └── admin/
│           ├── _components/       # Admin-specific components
│           └── users/
│               ├── _components/   # Users-specific components
│               └── page.tsx
```

### Placement Decision Rule (P0)

**"Bubble Up" principle**: Place components in the `_components` folder of the closest common ancestor.

| Component used in...                   | Place in...                                       |
| -------------------------------------- | ------------------------------------------------- |
| Only `blog/page.tsx`                   | `app/(public)/blog/_components/`                  |
| `blog/` AND `contact/`                 | `app/(public)/_components/`                       |
| Only `dashboard/settings/`             | `app/(protected)/dashboard/settings/_components/` |
| `dashboard/` AND `dashboard/settings/` | `app/(protected)/dashboard/_components/`          |
| `dashboard/` AND `admin/`              | `app/(protected)/_components/`                    |
| Public AND protected pages             | `components/`                                     |
| Shadcn/ui components                   | `components/ui/`                                  |
| Email templates                        | `components/emails/`                              |

### Examples

```bash
# Component used only in blog page
app/(public)/blog/_components/blog-post-card.tsx

# Component shared between blog and contact
app/(public)/_components/social-share-button.tsx

# Component used only in dashboard settings
app/(protected)/dashboard/settings/_components/settings-form.tsx

# Component shared across all dashboard pages
app/(protected)/dashboard/_components/dashboard-card.tsx

# Component shared between dashboard and admin
app/(protected)/_components/data-table.tsx

# Global component (public + protected)
components/logo.tsx

# Shadcn/ui component
components/ui/button.tsx

# Email template
components/emails/welcome-email.tsx
```

## Complete Examples

### Card Component

`app/(public)/jobs/_components/job-card.tsx`:

```tsx
import type { Job as PrismaJob } from "@prisma/client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Building, Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/utils/date/format-date";

export type Job = Pick
  PrismaJob,
  | "id"
  | "title"
  | "company"
  | "location"
  | "type"
  | "workTime"
  | "contractType"
  | "url"
  | "companyLogoUrl"
  | "publishedTime"
>;

type JobCardProps = {
  job: Job;
};

function JobCard({ job }: JobCardProps) {
  return (
    <Card className="border-slate-200 bg-white transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={job.companyLogoUrl || undefined}
                alt={job.company}
              />
              <AvatarFallback className="bg-slate-100 text-slate-600">
                {job.company.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-slate-800">
                {job.title}
              </h3>
              <div className="mb-2 flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>{job.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {job.workTime && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                  >
                    <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                    {job.workTime}
                  </Badge>
                )}

                {job.contractType && (
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                  >
                    {job.contractType}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="ml-4 text-right text-sm text-slate-500">
            <div className="mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
            </div>
            {job.publishedTime && (
              <div className="text-xs">
                Publié le {formatDate({ date: job.publishedTime })}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {job.url && (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={job.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Voir l'offre
                </Link>
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Postuler
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export { JobCard };
```

### List Component

`app/(public)/jobs/_components/job-list.tsx`:

```tsx
import { type Job, JobCard } from "@/app/(public)/jobs/_components/job-card";
import { JobListEmpty } from "@/app/(public)/jobs/_components/job-list-empty";

type JobListProps = {
  jobs: Job[];
};

function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return <JobListEmpty />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4">
        {jobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}

export { JobList };
```

### Empty State Component

`app/(public)/jobs/_components/job-list-empty.tsx`:

```tsx
import { Building } from "lucide-react";

function JobListEmpty() {
  return (
    <section className="py-12 text-center">
      <div className="mx-auto max-w-md">
        <Building
          className="mx-auto mb-4 h-12 w-12 text-slate-400"
          aria-hidden="true"
        />
        <h3 className="mb-2 text-lg font-medium text-slate-800">
          Aucune offre trouvée
        </h3>
        <p className="text-slate-500">
          Essayez de modifier vos critères de recherche pour voir plus d'offres.
        </p>
      </div>
    </section>
  );
}

export { JobListEmpty };
```

### Table Components

**DataTable is a dumb renderer**: it ONLY uses `getCoreRowModel()`. No client-side sorting, filtering, or pagination. All data operations happen server-side via URL params.

**SortableHeader** provides 3-state sort toggle (asc → desc → reset) via `useQueryStates`. When reset, `sortBy` and `order` are set to `null`, falling back to `withDefault()` defaults.

#### Columns with SortableHeader

`app/(protected)/admin/utilisateurs/_components/users-columns.tsx`:

```tsx
"use client";

import { useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useQueryStates } from "nuqs";

import { usersSearchParams } from "@/lib/constants/users-filters.constant";
import type { User } from "@/lib/generated/prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type UserTableData = Pick<
  User,
  "id" | "name" | "email" | "role" | "createdAt"
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
  },
  {
    accessorKey: "email",
    header: () => <SortableHeader field="email" label="Email" />,
  },
  {
    accessorKey: "role",
    header: "Rôle",
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role === "ADMIN" ? "Admin" : "Client"}
        </Badge>
      );
    },
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

#### DataTable (Dumb Renderer)

`components/ui/data-table.tsx`:

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
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable };
```

#### Table Wrapper (Page-Specific)

`app/(protected)/admin/utilisateurs/_components/users-table.tsx`:

```tsx
"use client";

import { DataTable } from "@/components/ui/data-table";

import {
  type UserTableData,
  usersColumns,
} from "@/app/(protected)/admin/utilisateurs/_components/users-columns";

function UsersTable({ users }: { users: UserTableData[] }) {
  return <DataTable columns={usersColumns} data={users} />;
}

export { UsersTable };
```

### Skeleton Component

`app/(protected)/dashboard/_components/stats-card-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

function StatsCardSkeleton() {
  return (
    <article className="flex items-center gap-4 rounded-lg border bg-white p-6 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </article>
  );
}

export { StatsCardSkeleton };
```

### Modal Component

`app/(protected)/dashboard/settings/_components/delete-account-modal.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteAccountModalProps = {
  onConfirm: () => Promise<void>;
};

function DeleteAccountModal({ onConfirm }: DeleteAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          Supprimer mon compte
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer votre compte</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes vos données seront
            définitivement supprimées.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Suppression..." : "Confirmer la suppression"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccountModal };
```

## Anti-Patterns

```tsx
// ❌ Wrong: PascalCase file name
// File: StatsCard.tsx

// ❌ Wrong: missing suffix
// File: stats.tsx (should be stats-card.tsx or stats-list.tsx)

// ❌ Wrong: default export
export default function StatsCard() { ... }

// ❌ Wrong: inline export
export function StatsCard() { ... }

// ❌ Wrong: interface instead of type
interface StatsCardProps { ... }

// ❌ Wrong: importing type without `type` keyword
import { ReactNode } from "react";

// ❌ Wrong: relative import path
import { JobCard } from "./job-card";

// ❌ Wrong: string concatenation for classes
className={`p-4 ${isActive ? "bg-blue-500" : "bg-gray-500"}`}

// ❌ Wrong: multiple components in one file
function CardHeader() { ... }
function CardBody() { ... }
function Card() { ... }
export { Card, CardHeader, CardBody };

// ❌ Wrong: "use client" without necessity
"use client";

function StaticText({ text }: { text: string }) {
  return <p>{text}</p>;
}

// ❌ Wrong: component in wrong location
// Using a component only in blog but placed in components/
components/blog-post-card.tsx // Should be in app/(public)/blog/_components/

// ❌ Wrong: missing type="button"
<button onClick={handleClick}>Click</button>

// ❌ Wrong: useState without callback for derived state
setCount(count + 1) // Should be setCount((currentCount) => currentCount + 1)

// ❌ Wrong: decorative icon without aria-hidden
<MapPin className="h-4 w-4" />
<span>Paris</span>

// ❌ Wrong: icon-only button without aria-label
<button type="button">
  <X className="h-4 w-4" />
</button>

// ❌ Wrong: implicit type in map
{jobs.map((job) => ...)}

// ❌ Wrong: abbreviated index variable
{items.map((item, i) => ...)}

// ❌ Wrong: empty state inline in list component
function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return <div>Aucune offre</div>; // Should be in job-list-empty.tsx
  }
  ...
}
```

## Key Principles

1. **One component, one file**: Keeps code organized and easy to find
2. **Named exports only**: Ensures consistent imports across the codebase
3. **Absolute paths only**: No relative imports, always use `@/` prefix
4. **Descriptive suffixes**: Component type is immediately clear from file name
5. **Empty states separated**: Always in dedicated `-empty.tsx` file
6. **Bubble up placement**: Components live at the closest common ancestor
7. **Server-first**: Default to Server Components, opt into Client only when needed
8. **Type safety**: Explicit typing with `type` keyword and `import type`
9. **Explicit map typing**: Always type callback parameters in `.map()`
10. **Responsive by default**: Every component works on desktop, tablet, and mobile
11. **Explicit button types**: Always specify `type="button"` or `type="submit"`
12. **Accessible icons**: `aria-hidden="true"` for decorative, `aria-label` for functional

```

```
