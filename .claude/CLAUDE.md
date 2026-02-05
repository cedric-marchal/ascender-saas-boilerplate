# CLAUDE.md - Ascender SaaS Boilerplate Guidelines

## Project Overview

This is a SaaS boilerplate built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Shadcn/ui, PNPM. The project follows strict conventions for consistency, maintainability, security, and SEO.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Database**: Prisma ORM + Neon (PostgreSQL)
- **Authentication**: Better Auth
- **Payments**: Stripe (subscriptions)
- **URL State**: Nuqs
- **Validation**: Zod
- **Emails**: Resend + React Email
- **Environment**: T3 Env
- **Storage**: Cloudflare R2 + Sharp (image optimization)
- **Deployment**: Vercel

## Project Structure

```
├── app/
│   ├── (public)/                    # Public pages (SEO-indexed)
│   │   ├── _components/             # Shared public components
│   │   │   ├── modals/              # Shared public modals
│   │   │   └── forms/               # Shared public forms
│   │   └── [page]/
│   │       ├── _components/         # Page-specific components
│   │       │   ├── modals/          # Page-specific modals
│   │       │   └── forms/           # Page-specific forms
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── (protected)/
│   │   ├── _components/             # Shared protected components
│   │   │   ├── modals/              # Shared protected modals
│   │   │   └── forms/               # Shared protected forms
│   │   ├── dashboard/
│   │   │   ├── _components/
│   │   │   │   ├── modals/
│   │   │   │   └── forms/
│   │   │   └── [page]/
│   │   └── admin/
│   │       ├── _components/
│   │       │   ├── modals/
│   │       │   └── forms/
│   │       └── [page]/
│   └── api/                         # API Routes
├── components/
│   ├── ui/                          # Shadcn/ui components
│   └── emails/                      # Email templates
├── lib/
│   ├── schemas/                     # Zod schemas
│   ├── auth.ts
│   ├── prisma.ts
│   ├── env.ts
│   └── utils.ts
└── utils/
    └── api/
        └── handle-api-error.ts
```

## Core Principles

1. **Zero-bug tolerance**: Code must be production-ready
2. **Binary logic**: Either success or throw (no multiple returns in try blocks)
3. **Early return pattern**: Handle edge cases first, then main logic
4. **Type safety**: Explicit typing everywhere, no implicit any
5. **Explicit naming**: Full words, no abbreviations
6. **Server-first**: Server Components by default
7. **SEO-friendly**: Proper metadata, JSON-LD, canonical URLs
8. **Accessible**: ARIA attributes, semantic HTML
9. **Responsive**: Desktop, tablet, mobile

## Server-Only Protection (P0)

Files containing functions or variables used exclusively server-side MUST be protected with `server-only` import at the top of the file.

```tsx
// ✅ Correct: Protect server-only files
import "server-only";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
}
```

Files that MUST use `server-only`:

- Database query functions
- Authentication helpers (e.g., `requireSession`, `requireAdmin`)
- Server-side data fetching utilities
- Any file with direct Prisma access outside of API routes

## Naming Conventions

### Explicit Names (P0)

ALWAYS use full, descriptive names. NEVER use abbreviations.

```tsx
// ✅ Correct
function handleSubmit(event: FormEvent<HTMLFormElement>) { ... }
function handleChange(event: ChangeEvent<HTMLInputElement>) { ... }
function handleClick(event: MouseEvent<HTMLButtonElement>) { ... }
const response = await fetch("/api/users");
const body = await response.json();
const document = await prisma.document.findUnique({ ... });
const user = await prisma.user.findUnique({ ... });
items.map((item: Item, index: number) => ...)
users.forEach((user: User) => ...)

// ❌ Wrong: abbreviated names
function handleSubmit(e) { ... }
function handleChange(evt) { ... }
const res = await fetch("/api/users");
const doc = await prisma.document.findUnique({ ... });
const usr = await prisma.user.findUnique({ ... });
items.map((item, i) => ...)
items.map((item, idx) => ...)
items.map((_, i) => ...)
```

### Variable Naming Rules

| Context         | Correct                       | Wrong                        |
| --------------- | ----------------------------- | ---------------------------- |
| Event handlers  | `event`                       | `e`, `evt`                   |
| Fetch response  | `response`                    | `res`, `r`                   |
| Response body   | `body`                        | `result`, `data`             |
| Database result | `document`, `user`, `project` | `doc`, `usr`, `proj`         |
| Array index     | `index`                       | `i`, `idx`, `_`              |
| Error           | `error`                       | `err`, `e`                   |
| Request         | `request`                     | `req`                        |
| Configuration   | `config`                      | `cfg`                        |
| Parameters      | `params`                      | `p`                          |
| Options         | `options`                     | `opts`                       |
| Reference       | `reference`                   | `ref` (except React refs)    |
| Properties      | `properties`                  | `props` (except React props) |
| Temporary       | `temporary`                   | `temp`, `tmp`                |
| Previous        | `previous`                    | `prev`                       |
| Current         | `current`                     | `curr`                       |
| Button          | `button`                      | `btn`                        |
| Number          | `count`, `total`, `quantity`  | `num`, `n`                   |

## Coding Conventions

### General Rules

- Use `import type` for type-only imports
- Use absolute paths with `@/` prefix (never relative)
- No comments in code
- French for user-facing messages, English for code
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Always add `type="button"` on button elements (except submit)
- Add `aria-hidden="true"` on decorative icons
- Always type event handlers with proper event types
- Always type map/forEach callbacks explicitly

### Binary Logic & Early Return Pattern (P0)

**Context matters:**

- **Components & synchronous functions**: Use early return pattern for edge cases
- **Try/catch blocks (forms, async operations)**: Use throw pattern (no multiple returns in try block)

```tsx
// ✅ Correct: Early return pattern in components
function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return <UserProfileEmpty />;
  }

  if (user.isBlocked) {
    return <UserProfileBlocked />;
  }

  return (
    <article>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </article>
  );
}

// ✅ Correct: Throw pattern in server functions
async function getDocument(id: string, userId: string) {
  if (!id) {
    throw new BadRequestError("ID requis");
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, name: true, userId: true },
  });

  if (!document) {
    throw new NotFoundError("Document introuvable");
  }

  if (document.userId !== userId) {
    throw new ForbiddenError("Accès non autorisé");
  }

  return document;
}

// ✅ Correct: Throw pattern in try/catch (forms)
async function onSubmit(data: FormData) {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.message || "Une erreur est survenue");
    }

    // Only one success path
    toast.success("Succès !");
  } catch (error: unknown) {
    toast.error(
      error instanceof Error ? error.message : "Une erreur est survenue"
    );
  }
}

// ❌ Wrong: Nested conditionals
function UserProfile({ user }: UserProfileProps) {
  if (user) {
    if (!user.isBlocked) {
      return (
        <article>
          <h1>{user.name}</h1>
        </article>
      );
    } else {
      return <UserProfileBlocked />;
    }
  } else {
    return <UserProfileEmpty />;
  }
}

// ❌ Wrong: Early return in try block (forms)
async function onSubmit(data: FormData) {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      toast.error("Erreur");
      return; // Multiple exits in try block
    }

    toast.success("Succès !");
  } catch (error: unknown) {
    toast.error("Erreur");
  }
}
```

### Event Handler Typing (P0)

ALWAYS import and use proper event types.

```tsx
import type { ChangeEvent, FormEvent, MouseEvent, KeyboardEvent, DragEvent } from "react";

// ✅ Correct: Fully typed event handlers
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
  const value = event.target.value;
}

function handleTextareaChange(event: ChangeEvent<HTMLTextAreaElement>) {
  const value = event.target.value;
}

function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
  const value = event.target.value;
}

function handleButtonClick(event: MouseEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    // ...
  }
}

function handleDragOver(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
}

// ❌ Wrong: Untyped or abbreviated
function handleSubmit(e) { ... }
function handleChange(evt: any) { ... }
function onClick(event) { ... }
```

### Map & Iteration Typing (P0)

ALWAYS type callback parameters explicitly.

```tsx
// ✅ Correct: Explicit typing in callbacks
{users.map((user: User) => (
  <UserCard key={user.id} user={user} />
))}

{items.map((item: Item, index: number) => (
  <div key={index}>{item.name}</div>
))}

{Array.from({ length: 6 }).map((_, index: number) => (
  <Skeleton key={index} className="h-32" />
))}

users.forEach((user: User) => {
  console.log(user.name);
});

const names = users.filter((user: User) => user.isActive)
  .map((user: User) => user.name);

// ❌ Wrong: Implicit or abbreviated
{users.map((user) => ...)}
{items.map((item, i) => ...)}
{items.map((_, idx) => ...)}
users.forEach((u) => ...);
```

### File Naming

- Components: `kebab-case.tsx` (e.g., `user-card.tsx`)
- Schemas: `{entity}.schema.ts` (e.g., `document.schema.ts`)
- API Routes: `route.ts` in appropriate folder

### Component Suffixes

| Suffix          | Usage                              | Location              |
| --------------- | ---------------------------------- | --------------------- |
| `-card.tsx`     | Displays ONE resource              | `_components/`        |
| `-list.tsx`     | Maps over cards                    | `_components/`        |
| `-table.tsx`    | Data table                         | `_components/`        |
| `-columns.tsx`  | Table column definitions           | `_components/`        |
| `-row.tsx`      | Single table row                   | `_components/`        |
| `-form.tsx`     | Form component                     | `_components/forms/`  |
| `-modal.tsx`    | Dialog/Modal                       | `_components/modals/` |
| `-button.tsx`   | Button with specific logic         | `_components/`        |
| `-header.tsx`   | Section/page header                | `_components/`        |
| `-tabs.tsx`     | Tab navigation                     | `_components/`        |
| `-filters.tsx`  | Filters (Nuqs)                     | `_components/`        |
| `-skeleton.tsx` | Loading state                      | `_components/`        |
| `-empty.tsx`    | Empty state (always separate file) | `_components/`        |
| `-error.tsx`    | Error state                        | `_components/`        |

### Component Location Rules (P0)

- **Modals**: ALWAYS in `_components/modals/`
- **Forms**: ALWAYS in `_components/forms/`
- **Other components**: In `_components/` root

```bash
# ✅ Correct structure
app/(protected)/dashboard/settings/
├── _components/
│   ├── modals/
│   │   └── delete-account-modal.tsx
│   ├── forms/
│   │   ├── profile-form.tsx
│   │   └── delete-account-form.tsx
│   ├── settings-header.tsx
│   └── settings-tabs.tsx
├── page.tsx
└── loading.tsx

# ❌ Wrong: Modal/Form in root _components
app/(protected)/dashboard/settings/
├── _components/
│   ├── delete-account-modal.tsx    # Should be in modals/
│   ├── profile-form.tsx            # Should be in forms/
│   └── settings-header.tsx
```

## Component Guidelines

### Structure

```tsx
// 1. Type imports first
// 2. Regular imports
import { type ChangeEvent, type FormEvent, useState } from "react";

import type { User } from "@prisma/client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

// 3. Types (if >2 props)
type UserFormProps = {
  user: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading: boolean;
};

// 4. Function with early returns
function UserForm({ user, onSubmit, isLoading }: UserFormProps) {
  const [name, setName] = useState(user.name);

  if (!user.isActive) {
    return <UserFormDisabled />;
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ name });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={handleNameChange}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}

// 5. Export (always named, never default)
export { UserForm };
```

### Props Typing

- 2 or fewer props: inline type
- More than 2 props: separate `{ComponentName}Props` type

### Server vs Client Components

- Server Components by default (no directive needed)
- `"use client"` only for: event handlers, hooks, browser APIs

### Component Location (Bubble Up Principle)

Place components in the `_components` folder of the closest common ancestor:

| Used in...               | Place in...                        |
| ------------------------ | ---------------------------------- |
| Only one page            | `app/(public)/[page]/_components/` |
| Multiple public pages    | `app/(public)/_components/`        |
| Multiple protected pages | `app/(protected)/_components/`     |
| Public AND protected     | `components/`                      |

## Page Guidelines

### Naming

- Function: `{Path}Page` (e.g., `BlogPage`, `DashboardSettingsPage`)
- Top-level element: `<main>`

### Public Pages

```tsx
import type { Metadata } from "next";

import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "Description here";

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

## Loading Page Guidelines

### Naming

- Function: `{Path}Loading` (e.g., `BlogLoading`, `DashboardSettingsLoading`)

### Structure

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ExampleLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement..."
      className="container mx-auto px-4 py-8"
    >
      {Array.from({ length: 6 }).map((_, index: number) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </main>
  );
}
```

## Zod Schema Guidelines

### Location

`@/lib/schemas/{entity}.schema.ts`

### Order

Read → Create → Replace → Update → Delete (matching HTTP methods)

### Structure

```tsx
import { z } from "zod";

const CreateDocumentSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
});

const UpdateDocumentSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
});

type CreateDocumentSchemaType = z.infer<typeof CreateDocumentSchema>;
type UpdateDocumentSchemaType = z.infer<typeof UpdateDocumentSchema>;

export { CreateDocumentSchema, UpdateDocumentSchema };

export type { CreateDocumentSchemaType, UpdateDocumentSchemaType };
```

### Rules

- String: `.min()` → `.max()` → `.trim()` (in this order)
- Number: `.min()` → `.max()` with French error messages
- Constants: internal only (not exported)
- Types: `{SchemaName}Type`

## API Route Guidelines

### Order

GET → POST → PUT → PATCH → DELETE

### Structure with Early Return Pattern

```tsx
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    return NextResponse.json(
      { success: true, data: document },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function POST(request: Request) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
    });

    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    await prisma.document.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { GET, POST, DELETE };
```

### Rules

- Always use `request.formData()` (never `.json()`)
- Always use `select` in Prisma queries
- Use `$transaction` or `Promise.all` for parallel queries
- Type error as `unknown` in catch
- Status codes: 200 (GET/PATCH), 201 (POST), 204 (DELETE)

## Form Guidelines

### Location

- Forms MUST be in `_components/forms/`
- Modals MUST be in `_components/modals/`
- Forms and Modals MUST always be separate files

### Structure

```tsx
"use client";

import { type ChangeEvent, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/lib/schemas/contact.schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateContactSchemaType>({
    resolver: zodResolver(CreateContactSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(data: CreateContactSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Une erreur est survenue");
      }

      toast.success("Message envoyé avec succès");
      form.reset();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Envoi..." : "Envoyer"}
        </Button>
      </form>
    </Form>
  );
}

export { ContactForm };
```

### Rules

- Always use `react-hook-form` with `zodResolver`
- Always type `useForm<SchemaType>` with `defaultValues`
- Always use `FormData` for API submission
- File inputs MUST include drag & drop functionality
- Use `toast` for success/error feedback
- Reset form on success with `form.reset()`

## Nuqs Filter Guidelines

### Options

| Option            | Value   | Reason                 |
| ----------------- | ------- | ---------------------- |
| `shallow`         | `false` | Server re-fetches data |
| `history`         | `push`  | Back button works      |
| `startTransition` | Used    | Shows loading state    |

### Parser Security

- Use `createParser` for custom validation (page bounds, search length)
- Use `parseAsStringLiteral` for enum values
- Always use `withDefault()` to avoid null
- Validate server-side too (defense in depth)

### SEO

- Index pages 1-10 only
- Set canonical on base page
- Use `rel="prev"` / `rel="next"` for pagination

## Prisma Guidelines

- Always use `select` to specify returned fields
- Use `$transaction` for parallel count + findMany
- Use `Promise.all` for independent parallel queries
- Never return raw database objects
- Use full variable names for results

```tsx
// ✅ Correct
const document = await prisma.document.findUnique({ ... });
const user = await prisma.user.findFirst({ ... });
const [projects, totalCount] = await prisma.$transaction([...]);

// ❌ Wrong
const doc = await prisma.document.findUnique({ ... });
const usr = await prisma.user.findFirst({ ... });
const [proj, count] = await prisma.$transaction([...]);
```

## Error Handling

Binary pattern: either success or throw (early throw pattern)

| Error Class                | Status | Usage          |
| -------------------------- | ------ | -------------- |
| `BadRequestError`          | 400    | Invalid input  |
| `UnauthorizedError`        | 401    | No session     |
| `ForbiddenError`           | 403    | Not allowed    |
| `NotFoundError`            | 404    | Not found      |
| `ConflictError`            | 409    | Duplicate      |
| `PayloadTooLargeError`     | 413    | Too large      |
| `UnprocessableEntityError` | 422    | Semantic error |
| `TooManyRequestsError`     | 429    | Rate limited   |

## Anti-Patterns Summary

```tsx
// ❌ NEVER use abbreviated names
e, evt, res, req, doc, usr, btn, cfg, opts, prev, curr, temp, idx, i

// ❌ NEVER use untyped event handlers
function handleChange(e) { ... }
function handleSubmit(event) { ... }

// ❌ NEVER use implicit types in callbacks
items.map((item) => ...)
items.map((item, i) => ...)

// ❌ NEVER use nested conditionals
if (condition1) {
  if (condition2) {
    // main logic
  }
}

// ❌ NEVER use multiple returns mixed with logic
if (data) {
  return process(data);
} else {
  return null;
}

// ❌ NEVER use early return in try/catch blocks (forms, async operations)
try {
  const response = await fetch("/api/endpoint", { ... });
  if (!response.ok) {
    toast.error("Erreur");
    return; // Should throw instead
  }
  toast.success("Succès");
} catch (error) { ... }

// ❌ NEVER use default exports
export default function Component() { ... }

// ❌ NEVER use relative imports
import { Component } from "./component";

// ❌ NEVER use request.json()
const data = await request.json();

// ❌ NEVER omit select in Prisma
const user = await prisma.user.findUnique({ where: { id } });

// ❌ NEVER put forms outside of _components/forms/
app/(public)/contact/_components/contact-form.tsx

// ❌ NEVER put modals outside of _components/modals/
app/(public)/contact/_components/contact-modal.tsx

// ❌ NEVER combine form and modal in same file
```

## Skill Files

For detailed conventions, read the appropriate skill file before implementing:

- **Pages**: `/mnt/skills/user/ascender-saas-boilerplate/rules/page.md`
- **Loading**: `/mnt/skills/user/ascender-saas-boilerplate/rules/loading.md`
- **Components**: `/mnt/skills/user/ascender-saas-boilerplate/rules/component.md`
- **Zod Schemas**: `/mnt/skills/user/ascender-saas-boilerplate/rules/zod.md`
- **API Routes**: `/mnt/skills/user/ascender-saas-boilerplate/rules/api-route.md`
- **Nuqs Filters**: `/mnt/skills/user/ascender-saas-boilerplate/rules/nuqs-filters.md`
- **Forms**: `/mnt/skills/user/ascender-saas-boilerplate/rules/form.md`
