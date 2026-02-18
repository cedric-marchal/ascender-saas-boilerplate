# Page & Loading Page Rules

## Context

Rules for `page.tsx` and `loading.tsx` files in Next.js App Router.

## Page Rules

### Naming (P0)

Function: `{Path}Page` (English PascalCase + `Page`)

For French URLs, use English equivalent:

- `app/(public)/tarifs/page.tsx` → `PricingPage`
- `app/(public)/(auth)/connexion/page.tsx` → `SignInPage`
- `app/(protected)/dashboard/parametres/page.tsx` → `DashboardSettingsPage`
- `app/(protected)/admin/utilisateurs/page.tsx` → `AdminUsersPage`

### Structure (P0)

- Top-level element: `<main>`
- Responsive: desktop, tablet, mobile
- Semantic HTML: `h1` → `h2` → `h3`, `aria-*` attributes
- Import types: combine from same module (`import { value, type Type } from "module"`)

### Metadata (P1)

**Public pages** — ALL fields:

```tsx
export const metadata: Metadata = {
  title: `${APP_NAME} - [Tagline]`,
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "keyword-1", "keyword-2"],
  alternates: { canonical: "/path" },
  openGraph: { title: "...", description: "...", url: "/path" },
  twitter: { title: "...", description: "..." },
};
```

**Protected pages** — ONLY `title` + `robots`:

```tsx
export const metadata: Metadata = {
  title: "Page Title",
  robots: { index: false, follow: false },
};
```

### Structured Data (P1)

**Public pages** — MUST include JSON-LD:

```tsx
const pageSchema: WithContext<WebPage> = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${BASE_URL}/path/#webpage`,
  name: "Page Title",
  url: `${BASE_URL}/path`,
  description: DESCRIPTION,
  inLanguage: "fr-FR",
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
```

**Protected pages** — MUST NOT include structured data.

### Auth Guards (P0)

Dashboard: `await requireSession()`

Admin: `await requireAdmin()`

### Environment Variables (P2)

Use `env` from `@/lib/env`:

```tsx
import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
```

### Examples

**Public Page**:

```tsx
import type { Metadata } from "next";

import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "...";

export const metadata: Metadata = {
  title: `Tarifs - ${APP_NAME}`,
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "pricing", "tarifs"],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: `Tarifs - ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/pricing",
  },
  twitter: { title: `Tarifs - ${APP_NAME}`, description: DESCRIPTION },
};

export default function PricingPage() {
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

**Protected Page**:

```tsx
import type { Metadata } from "next";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default async function DashboardSettingsPage() {
  await requireSession();
  return <main>{/* content */}</main>;
}
```

## Loading Page Rules

### Naming (P0)

Function: `{Path}Loading` (English PascalCase + `Loading`)

Examples:

- `app/(public)/blog/loading.tsx` → `BlogLoading`
- `app/(protected)/dashboard/parametres/loading.tsx` → `DashboardSettingsLoading`
- `app/(protected)/admin/utilisateurs/loading.tsx` → `AdminUsersLoading`

### Structure (P0)

- Top-level element: `<main>` with `aria-busy="true"` + `aria-label="Chargement..."`
- Use `Skeleton` from `@/components/ui/skeleton`
- Mirror the layout structure of corresponding `page.tsx`

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

### Rules (P0)

- NO data fetching
- NO async/await
- NO server-only imports
- NO metadata export
- MUST mirror page layout with Skeleton components

## Anti-Patterns

```tsx
// ❌ Pages

// Wrong: Missing `type` keyword
import { Metadata } from "next";

// Wrong: Generic function name
export default function Page() { ... }

// Wrong: Top-level element not <main>
export default function BlogPage() {
  return <div>...</div>;
}

// Wrong: Protected page with full metadata
export const metadata: Metadata = {
  title: "Dashboard",
  description: "...", // ❌
  keywords: ["..."],  // ❌
};

// Wrong: Protected page with JSON-LD
export default async function DashboardPage() {
  return (
    <>
      <script type="application/ld+json">...</script> {/* ❌ */}
      <main>...</main>
    </>
  );
}

// Wrong: Admin page using requireSession
export default async function AdminUsersPage() {
  await requireSession(); // ❌ Should be requireAdmin()
}

// ❌ Loading

// Wrong: Async function
export default async function DashboardLoading() {
  return <main>...</main>;
}

// Wrong: Missing accessibility
export default function BlogLoading() {
  return <main>{/* ❌ No aria-busy/aria-label */}</main>;
}

// Wrong: Not using Shadcn/ui Skeleton
export default function BlogLoading() {
  return (
    <main>
      <div className="h-4 w-32 animate-pulse bg-gray-200" /> {/* ❌ */}
    </main>
  );
}

// Wrong: Exporting metadata
export const metadata = { title: "Loading..." }; // ❌

export default function DashboardLoading() {
  return <main>...</main>;
}
```
