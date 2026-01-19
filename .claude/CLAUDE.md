# CLAUDE.md - Project Guidelines

## Project Overview

This is a SaaS boilerplate built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Shadcn/ui. The project follows strict conventions for consistency, maintainability, security, and SEO.

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
│   │   └── [page]/
│   │       ├── _components/         # Page-specific components
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── (protected)/
│   │   ├── _components/             # Shared protected components
│   │   ├── dashboard/
│   │   │   ├── _components/
│   │   │   └── [page]/
│   │   └── admin/
│   │       ├── _components/
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
├── utils/
│   └── api/
│       └── handle-api-error.ts
└──
```

## Core Principles

1. **Zero-bug tolerance**: Code must be production-ready
2. **Binary error handling**: Either success or throw (no multiple returns)
3. **Type safety**: Explicit typing everywhere
4. **Server-first**: Server Components by default
5. **SEO-friendly**: Proper metadata, JSON-LD, canonical URLs
6. **Accessible**: ARIA attributes, semantic HTML
7. **Responsive**: Desktop, tablet, mobile

## Coding Conventions

### General Rules

- Use `import type` for type-only imports
- Use absolute paths with `@/` prefix (never relative)
- No comments in code
- French for user-facing messages, English for code
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Always add `type="button"` on button elements (except submit)
- Add `aria-hidden="true"` on decorative icons
- Type event handlers explicitly (e.g., `event: ChangeEvent<HTMLInputElement>`)
- Use `index: number` in map callbacks (not `i` or `_`)

### File Naming

- Components: `kebab-case.tsx` (e.g., `user-card.tsx`)
- Schemas: `{entity}.schema.ts` (e.g., `document.schema.ts`)
- API Routes: `route.ts` in appropriate folder

### Component Suffixes

| Suffix | Usage |
|--------|-------|
| `-card.tsx` | Displays ONE resource |
| `-list.tsx` | Maps over cards |
| `-table.tsx` | Data table |
| `-columns.tsx` | Table column definitions |
| `-row.tsx` | Single table row |
| `-form.tsx` | Form component |
| `-modal.tsx` | Dialog/Modal |
| `-button.tsx` | Button with specific logic |
| `-header.tsx` | Section/page header |
| `-tabs.tsx` | Tab navigation |
| `-filters.tsx` | Filters (Nuqs) |
| `-skeleton.tsx` | Loading state |
| `-empty.tsx` | Empty state (always separate file) |
| `-error.tsx` | Error state |

## Component Guidelines

### Structure
```tsx
// 1. Imports (type imports first)
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 2. Types (if >2 props)
type MyComponentProps = {
  title: string;
  children: ReactNode;
};

// 3. Function
function MyComponent({ title, children }: MyComponentProps) {
  return <div>{title}</div>;
}

// 4. Export (always named, never default)
export { MyComponent };
```

### Props Typing

- 2 or fewer props: inline type
- More than 2 props: separate `{ComponentName}Props` type

### Server vs Client Components

- Server Components by default (no directive needed)
- `"use client"` only for: event handlers, hooks, browser APIs

### Component Location (Bubble Up Principle)

Place components in the `_components` folder of the closest common ancestor:

| Used in... | Place in... |
|------------|-------------|
| Only one page | `app/(public)/[page]/_components/` |
| Multiple public pages | `app/(public)/_components/` |
| Multiple protected pages | `app/(protected)/_components/` |
| Public AND protected | `components/` |

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
  const pageSchema: WithContext<WebPage> = { /* ... */ };

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
// or: import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Page Title",
  robots: { index: false, follow: false },
};

export default async function DashboardExamplePage() {
  await requireSession();
  // or: await requireAdmin();

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
      {/* Skeletons mirroring page structure */}
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

### Structure
```tsx
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  BadRequestError,
  ForbiddenError,
  handleApiError,
  NotFoundError,
  UnauthorizedError,
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

    return NextResponse.json({ success: true, data: document }, { status: 200 });
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

    return NextResponse.json({ success: true, data: document }, { status: 201 });
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

## Nuqs Filter Guidelines

### Options

| Option | Value | Reason |
|--------|-------|--------|
| `shallow` | `false` | Server re-fetches data |
| `history` | `push` | Back button works |
| `startTransition` | Used | Shows loading state |

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

## Error Handling

Binary pattern: either success or throw

| Error Class | Status | Usage |
|-------------|--------|-------|
| `BadRequestError` | 400 | Invalid input |
| `UnauthorizedError` | 401 | No session |
| `ForbiddenError` | 403 | Not allowed |
| `NotFoundError` | 404 | Not found |
| `ConflictError` | 409 | Duplicate |
| `PayloadTooLargeError` | 413 | Too large |
| `UnprocessableEntityError` | 422 | Semantic error |
| `TooManyRequestsError` | 429 | Rate limited |

## Skill Files

For detailed conventions, read the appropriate skill file before implementing:

- **Pages**: `/mnt/skills/user/sums-boilerplate/rules/page.md`
- **Loading**: `/mnt/skills/user/sums-boilerplate/rules/loading.md`
- **Components**: `/mnt/skills/user/sums-boilerplate/rules/component.md`
- **Zod Schemas**: `/mnt/skills/user/sums-boilerplate/rules/zod.md`
- **API Routes**: `/mnt/skills/user/sums-boilerplate/rules/api-route.md`
- **Nuqs Filters**: `/mnt/skills/user/sums-boilerplate/rules/nuqs-filters.md`