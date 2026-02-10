# Page Creation Rules

## Context

These rules apply exclusively to creating new `page.tsx` files in the Next.js App Router structure.

## Rules

### 1. Function Naming (P0)

- The exported function name MUST use English semantic names in PascalCase + `Page`
- For French URL paths, use the English equivalent for the function name
- Protected pages MUST include their section prefix (`Dashboard`, `Admin`)
- Examples:
  - `app/(public)/blog/page.tsx` → `BlogPage`
  - `app/(public)/tarifs/page.tsx` → `PricingPage`
  - `app/(public)/(auth)/connexion/page.tsx` → `SignInPage`
  - `app/(public)/(auth)/inscription/page.tsx` → `SignUpPage`
  - `app/(public)/(auth)/mot-de-passe-oublie/page.tsx` → `ForgotPasswordPage`
  - `app/(public)/(legal)/mentions-legales/page.tsx` → `LegalNoticePage`
  - `app/(protected)/dashboard/page.tsx` → `DashboardPage`
  - `app/(protected)/dashboard/parametres/page.tsx` → `DashboardSettingsPage`
  - `app/(protected)/dashboard/facturation/page.tsx` → `DashboardBillingPage`
  - `app/(protected)/dashboard/projets/page.tsx` → `DashboardProjectsPage`
  - `app/(protected)/admin/utilisateurs/page.tsx` → `AdminUsersPage`

### 2. Page Structure (P0)

- The top-level returned element MUST be a `<main>` tag
- Pages MUST be responsive for three screen types: desktop, tablet, mobile
- Use semantic HTML, proper heading hierarchy (`h1` → `h2` → `h3`), and `aria-*` attributes for accessibility

### 3. Type Imports (P0)

- ALWAYS combine imports from the same module (never separate them)
- Use `import type {}` when importing ONLY types
- Use inline `type` keyword when mixing types and values
- NEVER have multiple import statements from the same module

```tsx
// ✅ Correct: Type-only imports
import type { Metadata } from "next";
import type { WebSite, WithContext } from "schema-dts";

// ✅ Correct: Mixed imports (if importing values too)
import { cookies, type Metadata } from "next";

// ❌ Wrong: Separate imports from the same module
import type { Metadata } from "next";
import { cookies } from "next";  // Should be combined above

// ❌ Wrong: Not using inline `type` keyword
import { Metadata, cookies } from "next";  // Metadata should have `type` prefix
```

### 4. Metadata Configuration (P1)

#### Public Pages (`app/(public)/**/page.tsx`)

Define ALL fields:

```tsx
export const metadata: Metadata = {
  title: `${APP_NAME} - [Tagline]`,
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "keyword-1", "keyword-2"],
  alternates: {
    canonical: "/path",
  },
  openGraph: {
    title: `${APP_NAME} - [Tagline]`,
    description: DESCRIPTION,
    url: "/path",
  },
  twitter: {
    title: `${APP_NAME} - [Tagline]`,
    description: DESCRIPTION,
  },
};
```

#### Protected Pages (`app/(protected)/**/page.tsx`)

Define ONLY `title` and `robots`:

```tsx
export const metadata: Metadata = {
  title: "Page Title",
  robots: {
    index: false,
    follow: false,
  },
};
```

### 5. Structured Data / JSON-LD (P1)

#### Public Pages

- MUST include `<script type="application/ld+json">` with schema.org data
- Choose schema type based on content: `WebSite`, `WebPage`, `Article`, `Product`, `Organization`, etc.

#### Protected Pages

- MUST NOT include any structured data

### 6. Authentication Guards (P0)

#### Dashboard Pages (`app/(protected)/dashboard/**/page.tsx`)

```tsx
import { requireSession } from "@/lib/session";

export default async function DashboardExamplePage() {
  await requireSession();
  // ...
}
```

#### Admin Pages (`app/(protected)/admin/**/page.tsx`)

```tsx
import { requireAdmin } from "@/lib/session";

export default async function AdminExamplePage() {
  await requireAdmin();
  // ...
}
```

### 7. Environment Variables (P2)

- Use `env` from `@/lib/env` for `APP_NAME` and `BASE_URL`
- NEVER hardcode these values

```tsx
import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
```

## Examples

### Public Page

`app/(public)/pricing/page.tsx`:

```tsx
import type { Metadata } from "next";

import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "Découvrez nos offres et tarifs adaptés à vos besoins.";

export const metadata: Metadata = {
  title: `Tarifs - ${APP_NAME}`,
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "pricing", "tarifs", "offres"],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: `Tarifs - ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/pricing",
  },
  twitter: {
    title: `Tarifs - ${APP_NAME}`,
    description: DESCRIPTION,
  },
};

export default function PricingPage() {
  const pageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/pricing/#webpage`,
    name: `Tarifs - ${APP_NAME}`,
    url: `${BASE_URL}/pricing`,
    description: DESCRIPTION,
    inLanguage: "fr-FR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema),
        }}
      />

      <main className="flex min-h-screen flex-col items-center">
        {/* Page content */}
      </main>
    </>
  );
}
```

### Dashboard Page

`app/(protected)/dashboard/settings/page.tsx`:

```tsx
import type { Metadata } from "next";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardSettingsPage() {
  await requireSession();

  return (
    <main className="flex min-h-screen flex-col">{/* Page content */}</main>
  );
}
```

### Admin Page

`app/(protected)/admin/users/page.tsx`:

```tsx
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <main className="flex min-h-screen flex-col">{/* Page content */}</main>
  );
}
```

## Anti-Patterns

```tsx
// ❌ Wrong: Missing `type` keyword
import { Metadata } from "next";

// ❌ Wrong: Function name doesn't match path
export default function Page() { ... }

// ❌ Wrong: Top-level element is not <main>
export default function BlogPage() {
  return <div>...</div>;
}

// ❌ Wrong: Protected page with full metadata
export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard", // ❌ Not allowed
  keywords: ["dashboard"],       // ❌ Not allowed
};

// ❌ Wrong: Protected page with JSON-LD
export default async function DashboardPage() {
  return (
    <>
      <script type="application/ld+json">...</script> {/* ❌ Not allowed */}
      <main>...</main>
    </>
  );
}

// ❌ Wrong: Admin page using requireSession instead of requireAdmin
export default async function AdminUsersPage() {
  await requireSession(); // ❌ Should be requireAdmin()
}
```
