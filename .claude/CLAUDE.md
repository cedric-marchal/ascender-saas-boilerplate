# Ascender SaaS Boilerplate — Claude Rules

## Overview

SaaS boilerplate: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui + pnpm.

**Goal**: Maximize signal, minimize tokens. Prefer Unix commands (`ls`, `rg`, `find`) as primary source of truth.

## Stack

| Layer       | Tech                         |
| ----------- | ---------------------------- |
| Framework   | Next.js 16 (App Router)      |
| Language    | TypeScript (strict)          |
| Styling     | Tailwind CSS 4 + Shadcn/ui   |
| DB          | Prisma 7 + Neon (PostgreSQL) |
| Auth        | Better Auth                  |
| Payments    | Stripe                       |
| URL State   | Nuqs                         |
| Validation  | Zod 4                        |
| Forms       | TanStack Form                |
| Tables      | TanStack Table               |
| Actions     | next-safe-action             |
| Emails      | React Email + Resend         |
| HTTP Client | up-fetch                     |
| Rate Limit  | Upstash Redis + Ratelimit    |
| Monitoring  | Sentry                       |
| Tests       | Vitest                       |

## Architecture: Feature-Based (P0)

```
app/                          # Routes only
├── (public)/                 # Public pages
├── (protected)/              # Dashboard + Admin
│   ├── dashboard/
│   └── admin/
└── api/                      # API route handlers

features/                     # ALL business logic
├── {feature}/
│   ├── actions/              # Server Actions (next-safe-action)
│   ├── components/           # UI (forms/, modals/ subdirs)
│   ├── constants/            # Domain-specific constants
│   ├── emails/               # React Email templates
│   ├── schemas/              # Zod validation
│   └── services/             # Server-only logic ("server-only")

lib/                          # Shared infrastructure
├── parsers/                  # Nuqs parsers
├── generated/                # Prisma client
├── auth.ts, prisma.ts, etc.  # Core configs

components/                   # Shared UI
├── ui/                       # Shadcn/ui
├── public/                   # Header, footer
├── protected/                # Sidebars
└── pagination.tsx            # Generic pagination

utils/                        # Pure utilities
├── errors/                   # Error classes, handlers
├── date/, ratelimit/, string/

hooks/                        # Shared hooks
```

## Source of Truth Hierarchy (P0)

```
Prisma Schema (UserRole, SubscriptionStatus enums)
  ↓
lib/generated/prisma/client  ← import UserRole, SubscriptionStatus directly from here
  ↓
lib/parsers/nuqs.ts
  ↓
features/{feature}/constants/ (DOMAIN: filters, searchParams)
  ↓
features/{feature}/schemas/ (Zod validation)
  ↓
features/{feature}/services/ (server data fetching, "server-only")
  ↓
features/{feature}/actions/ (server actions, "use server")
  ↓
features/{feature}/components/ (UI)
  ↓
app/*/page.tsx (pages import from features)
```

**Key principle**: Import Prisma enums (`UserRole`, `SubscriptionStatus`) directly from `@/lib/generated/prisma/client`.

## Core Conventions

| Rule              | Convention                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Imports**       | Absolute paths (`@/`), combine types+values, `import { value, type Type }`         |
| **Exports**       | Named only (never default)                                                         |
| **Naming**        | Full words (no abbreviations: `event` not `e`, `index` not `i`)                    |
| **Components**    | Server by default, `"use client"` only for hooks/events/browser APIs               |
| **Props**         | Inline if ≤2, separate `{Name}Props` type if >2, use `type` (never `interface`)    |
| **Event types**   | `SubmitEvent<HTMLFormElement>`, `ChangeEvent<HTMLInputElement>`, etc.              |
| **Callbacks**     | Always type params: `.map((item: Item) => ...)`, `.map((_, index: number) => ...)` |
| **Buttons**       | `type="button"` (except submit), `aria-hidden="true"` on decorative icons          |
| **Forms**         | TanStack Form + Zod + `useAction` + `getActionResult` + `getErrorMessage`          |
| **Error pattern** | Components: early return. Async: throw (no multiple returns in try)                |
| **Prisma**        | Always `select` + `take` on `findMany`, `$transaction` for parallel count+findMany |
| **Strings**       | `.min().max().trim()` (always French error messages)                               |
| **User messages** | French. Code: English.                                                             |
| **File naming**   | kebab-case.tsx                                                                     |

## Security: IDOR Prevention (P0) 🔴

| Rule                    | Convention                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **Service params**      | ALWAYS `userId: string` + `userRole: UserRole` (NEVER booleans like `isAdmin`)                      |
| **Authorization**       | Define `UNRESTRICTED_ROLES: UserRole[]` constant, check with `.includes(userRole)`                  |
| **Filtering**           | Filter by `userId` by default UNLESS `userRole` in `UNRESTRICTED_ROLES`                             |
| **Rate limiting**       | ALWAYS `await checkRatelimit(filterRatelimit, userId)` in services                                   |
| **Type safety**         | Import `UserRole` from `@/lib/generated/prisma/client` (NEVER strings/booleans)                     |
| **Extensibility**       | Pattern supports multiple roles (ADMIN, MANAGER, MODERATOR) without code changes                    |
| **Full documentation**  | See `.claude/rules/security.md` for complete patterns and examples                                   |

**Critical Example** :

```tsx
// ❌ WRONG: Boolean permissions (not extensible, not type-safe)
async function getDocuments(userId: string, isAdmin: boolean = false) { }

// ✅ CORRECT: UserRole permissions (extensible, type-safe)
import { UserRole } from "@/lib/generated/prisma/client";

const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getDocuments(
  filters: GetDocumentsFilters,
  userId: string,
  userRole: UserRole
) {
  await checkRatelimit(filterRatelimit, userId);
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const whereClause = {
    ...(!canAccessAllData && { userId }),  // Non-admin sees only their data
  };
}
```

## Enum Usage (P0)

### UserRole

```tsx
// ✅ Import direct depuis Prisma (valeur)
import { UserRole } from "@/lib/generated/prisma/client";

// ✅ Import direct depuis Prisma (type uniquement)
import type { UserRole } from "@/lib/generated/prisma/client";

if (user.role === UserRole.ADMIN) { ... }

// ❌ NEVER magic strings
if (user.role === "ADMIN") { ... }
```

### SubscriptionStatus

```tsx
// ✅ Type depuis Prisma
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";

// ✅ Constantes depuis features/billing
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
} from "@/features/billing/constants/subscription-status.constant";

if (ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) { ... }
const label = subscriptionStatusLabels[subscription.status];

// ❌ NEVER hardcode
if (subscription.status === "active" || subscription.status === "trialing") { ... }
```

### Exhaustive Records

```tsx
// ✅ Record<Enum, T> = fail-fast on missing enum values
const STATUS_CONFIG: Record<SubscriptionStatus, StatusConfig> = {
  incomplete: { icon: Clock, variant: "secondary" },
  active: { icon: CheckCircle, variant: "default" },
  // ... TypeScript errors if any status missing
};

// ❌ Record<string, T> = silent bugs
const STATUS_CONFIG: Record<string, StatusConfig> = { ... };
```

## Feature Module Rules (P0)

### File Locations

| Type      | Path                                                        | Example                                                       |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Schema    | `features/{feature}/schemas/{entity}.schema.ts`             | `features/contact/schemas/contact.schema.ts`                  |
| Action    | `features/{feature}/actions/{verb}-{entity}.action.ts`      | `features/contact/actions/create-contact.action.ts`           |
| Service   | `features/{feature}/services/{verb}-{entity}.service.ts`    | `features/contact/services/create-contact.service.ts`         |
| Component | `features/{feature}/components/{name}.tsx`                  | `features/contact/components/forms/contact-form.tsx`          |
| Form      | `features/{feature}/components/forms/{entity}-form.tsx`     | `features/account/components/forms/profile-form.tsx`          |
| Modal     | `features/{feature}/components/modals/{entity}-modal.tsx`   | `features/account/components/modals/delete-account-modal.tsx` |
| Email     | `features/{feature}/emails/{entity}-email.tsx`              | `features/contact/emails/contact-email.tsx`                   |
| Constant  | `features/{feature}/constants/{entity}-filters.constant.ts` | `features/users/constants/users-filters.constant.ts`          |

### Naming Patterns

| Type      | Pattern                              | Example                            |
| --------- | ------------------------------------ | ---------------------------------- |
| Schema    | `{Action}{Entity}Schema`             | `CreateContactSchema`              |
| Type      | `{SchemaName}Type`                   | `CreateContactSchemaType`          |
| Action    | `{verb}{Entity}Action`               | `createContactAction`              |
| Service   | `{verb}{Entity}`                     | `createContact`                    |
| Component | PascalCase function, kebab-case file | `ContactForm` → `contact-form.tsx` |

### Schema Rules

Location: `features/{feature}/schemas/{entity}.schema.ts`

Order: Create → Update → Delete (matching POST → PATCH → DELETE)

String chain: `.min() → .max() → .trim()` (always with French messages)

Export: schemas first, then types. Named exports only.

```tsx
const CreateContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Max 200 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "Max 255 caractères")
    .trim()
    .email("Email invalide"),
});
type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;
export { CreateContactSchema };
export type { CreateContactSchemaType };
```

### Service Rules

- `import "server-only"` at top
- Always `select` + `take` on `findMany`
- `$transaction` for parallel count + findMany
- Re-validate all params server-side (defense in depth)

```tsx
import "server-only";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
} from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

async function getUsers(filters: GetUsersFilters) {
  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return { users, totalCount, totalPages, currentPage: safePage };
}
```

### Action Rules

File: `features/{feature}/actions/{verb}-{entity}.action.ts`

- `"use server"` at top (line 1)
- Use `actionClient` (public), `authActionClient` (auth), or `adminActionClient` (admin)
- `.inputSchema(Schema)` for validation
- No try/catch needed (next-safe-action handles it)
- Throw custom errors directly

```tsx
"use server";

import { CreateContactSchema } from "@/features/contact/schemas/contact.schema";
import { createContact } from "@/features/contact/services/create-contact.service";

import { actionClient } from "@/lib/safe-action";

export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await createContact(parsedInput);
    return { success: true };
  });
```

### Form Rules

Location: `features/{feature}/components/forms/{entity}-form.tsx`

- TanStack Form + Zod + `useAction` + `executeAsync`
- Use `getActionResult` in try/catch for throw-on-error pattern
- Use `getErrorMessage` for centralized error extraction

```tsx
"use client";

import { createContactAction } from "@/features/contact/actions/create-contact.action";
import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/features/contact/schemas/contact.schema";
import { useForm } from "@tanstack/react-form";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: { name: "", email: "" } as CreateContactSchemaType,
    validators: { onSubmit: CreateContactSchema },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));
        toast.success("Message envoyé avec succès !");
        form.reset();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      {/* fields */}
    </form>
  );
}
```

### Component Rules

- Named export only (never default)
- Server Component by default, `"use client"` only for hooks/events/browser APIs
- Props: inline if ≤2, separate `{Name}Props` type if >2
- `cn()` for conditional classes
- `aria-hidden="true"` on decorative icons
- `type="button"` on all non-submit buttons
- Empty states: always separate `-empty.tsx` file

## Data Display Conventions (P0)

### DB Data Truncation

ALWAYS truncate data received from database using `utils/string/truncate.ts` helpers. Apply with good judgment based on context.

| Helper                 | Length | Usage                                         |
| ---------------------- | ------ | --------------------------------------------- |
| `truncateTitle()`      | 60     | SEO titles, Open Graph, cards                 |
| `truncateDescription()`| 160    | Meta descriptions, Open Graph descriptions    |
| `truncatePreview()`    | 200    | 4-5 line article/post preview                 |
| `truncateExcerpt()`    | 300    | 6-8 line blog post excerpt                    |
| `truncateName()`       | 20     | Sidebar labels, avatar names, badges          |

```tsx
// ✅ Correct: Truncate DB data before display
import { truncateTitle, truncateDescription } from "@/utils/string/truncate";

const posts = await prisma.post.findMany({
  select: { id: true, title: true, description: true },
});

return posts.map((post) => ({
  id: post.id,
  title: truncateTitle(post.title),
  description: truncateDescription(post.description),
}));

// ✅ Correct: In components
function PostCard({ title, description }: PostCardProps) {
  return (
    <article>
      <h3>{truncateTitle(title)}</h3>
      <p>{truncateDescription(description)}</p>
    </article>
  );
}

// ❌ Wrong: No truncation
return posts.map((post) => ({
  id: post.id,
  title: post.title,  // Can overflow in card layouts
  description: post.description,
}));
```

**Decision guidelines:**

- Cards/lists: Always truncate titles, descriptions, names
- Full detail pages: No truncation (user wants full content)
- Metadata/SEO: Always truncate (Google limits)
- Admin tables: Truncate for readability, add tooltip for full text
- Search results: Truncate preview/excerpt

## API Route Rules

Location: `app/api/*/route.ts`

Order: GET → POST → PATCH → DELETE

Error imports: `@/utils/errors/errors` + `@/utils/errors/handle-api-error`

```tsx
import { NextResponse } from "next/server";

import { UpdateAvatarSchema } from "@/features/account/schemas/avatar.schema";
import { updateAvatar } from "@/features/account/services/update-avatar.service";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) throw new UnauthorizedError("Vous devez être connecté");

    const formData = await request.formData();
    const data = UpdateAvatarSchema.parse({ avatar: formData.get("avatar") });
    const result = await updateAvatar({
      userId: session.user.id,
      avatar: data.avatar,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
```

Rules:

- Always `request.formData()` (never `.json()`)
- Always `select` in Prisma queries
- Status: 200 (GET/PATCH), 201 (POST), 204 (DELETE)
- Delegate to services for business logic

## Page Rules

Function: `{Path}Page` (e.g., `ContactPage`, `DashboardSettingsPage`)

Top-level element: `<main>`

### Public Pages

```tsx
import type { Metadata } from "next";

import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = "...";

export const metadata: Metadata = {
  title: `${APP_NAME} - Tagline`,
  description: DESCRIPTION,
  keywords: ["keyword1", "keyword2"],
  alternates: { canonical: "/path" },
  openGraph: { title: "...", description: "...", url: "/path" },
  twitter: { title: "...", description: "..." },
};

export default function ExamplePage() {
  const pageSchema: WithContext<WebPage> = {
    /* ... */
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <main>{/* content */}</main>
    </>
  );
}
```

### Protected Pages

```tsx
import type { Metadata } from "next";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Page Title",
  robots: { index: false, follow: false },
};

export default async function DashboardExamplePage() {
  await requireSession();
  return <main>{/* content */}</main>;
}
```

### Loading Pages

Function: `{Path}Loading`

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ExampleLoading() {
  return (
    <main aria-busy="true" aria-label="Chargement...">
      {Array.from({ length: 6 }).map((_, index: number) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </main>
  );
}
```

## Filter/Sort/Pagination Pattern

See `filter.md` for complete 7-layer architecture.

Key principles:

- Enums in `features/{feature}/constants/{entity}-filters.constant.ts`
- Schemas in `features/{feature}/schemas/{entity}-filter.schema.ts`
- Services in `features/{feature}/services/get-{entity}.service.ts`
- DataTable: dumb renderer, only `getCoreRowModel()`
- Sorting: URL-based via `SortableHeader` (3-state: asc → desc → reset)
- Filtering: TanStack Form + Zod + `useQueryStates`
- Pagination: generic `Pagination` component

## Error Handling

Error classes: `@/utils/errors/errors`

| Class                      | Status | Usage          |
| -------------------------- | ------ | -------------- |
| `BadRequestError`          | 400    | Invalid input  |
| `UnauthorizedError`        | 401    | No session     |
| `ForbiddenError`           | 403    | Not allowed    |
| `NotFoundError`            | 404    | Not found      |
| `ConflictError`            | 409    | Duplicate      |
| `PayloadTooLargeError`     | 413    | Too large      |
| `UnprocessableEntityError` | 422    | Semantic error |
| `TooManyRequestsError`     | 429    | Rate limited   |

## Anti-Patterns

```tsx
// ❌ NEVER abbreviate
e, evt, res, req, doc, usr, btn, cfg, opts, prev, curr, temp, idx, i

// ❌ NEVER separate imports from same module
import type { Type } from "module";
import { value } from "module";
// ✅ Use: import { value, type Type } from "module";

// ❌ NEVER untyped handlers/callbacks
function handleChange(e) { ... }
items.map((item) => ...)

// ❌ NEVER default export
export default function Component() { ... }

// ❌ NEVER relative imports
import { Component } from "./component";

// ❌ NEVER magic strings for UserRole
if (user.role === "ADMIN") { ... }
// ✅ Use: import { UserRole } from "@/lib/generated/prisma/client";

// ❌ NEVER magic strings for enums
if (user.role === "ADMIN") { ... }

// ❌ NEVER Record<string, ...> for domain enums
const labels: Record<string, string> = { ... };

// ❌ NEVER omit select/take in Prisma
prisma.user.findMany({ where: { ... } });

// ❌ NEVER use native fetch
const response = await fetch("/api/endpoint", { ... });
// ✅ Use: upfetch from @/lib/up-fetch

// ❌ NEVER wrong file locations
lib/schemas/contact.schema.ts                    # → features/contact/schemas/
app/(public)/contact/_actions/                   # → features/contact/actions/
components/emails/contact-email.tsx              # → features/contact/emails/
```

## Detailed Rule Files

- **Filters, Sort & Pagination**: `.claude/rules/filter.md`
- **Forms**: `.claude/rules/form.md`
- **API Routes**: `.claude/rules/api.md`
- **Server Actions**: `.claude/rules/server-action.md`
- **Pages**: `.claude/rules/page.md`
- **Security (IDOR & Authorization)**: `.claude/rules/security.md` — **CRITICAL: Read this**
