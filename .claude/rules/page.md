# Page & Loading Page Rules

## Context

Rules for `page.tsx`, `loading.tsx`, feature page components, and global page components.

## Architecture: Thin Shim Pattern (P0)

`app/` route files are **thin shims** — they only contain Next.js concerns:
- `metadata` export
- `export default function {Path}Route()`
- Auth guards (`requireSession`, `requireAdmin`)
- Data fetching (only to pass as props)
- Redirects

All JSX, JSON-LD, and UI logic lives in feature page components.

```
app/(public)/tarifs/page.tsx          ← thin shim (metadata + return)
features/pricing/pages/pricing-page.tsx  ← all UI + JSON-LD
features/pricing/constants/pricing-seo.constant.ts  ← SEO constants + schema functions
```

## Route Function Naming (P0)

Function: `{Path}Route` in **English** PascalCase.

For French URLs, translate to English:

| URL | Function |
|---|---|
| `app/(public)/page.tsx` | `HomeRoute` |
| `app/(public)/tarifs/page.tsx` | `PricingRoute` |
| `app/(public)/contact/page.tsx` | `ContactRoute` |
| `app/(public)/plan-du-site/page.tsx` | `SitemapRoute` |
| `app/(public)/(auth)/connexion/page.tsx` | `SignInRoute` |
| `app/(public)/(auth)/inscription/page.tsx` | `SignUpRoute` |
| `app/(public)/(auth)/mot-de-passe-oublie/page.tsx` | `ForgotPasswordRoute` |
| `app/(public)/(auth)/nouveau-mot-de-passe/page.tsx` | `ResetPasswordRoute` |
| `app/(public)/(legal)/mentions-legales/page.tsx` | `LegalNoticeRoute` |
| `app/(public)/(legal)/conditions-de-vente/page.tsx` | `TermsOfSaleRoute` |
| `app/(protected)/dashboard/page.tsx` | `DashboardRoute` |
| `app/(protected)/dashboard/parametres/page.tsx` | `DashboardSettingsRoute` |
| `app/(protected)/dashboard/facturation/page.tsx` | `DashboardBillingRoute` |
| `app/(protected)/admin/page.tsx` | `AdminRoute` |
| `app/(protected)/admin/utilisateurs/page.tsx` | `AdminUsersRoute` |

## Feature Page Components (P0)

Location: `features/{feature}/pages/{name}-page.tsx`

Naming: `{Feature}Page` (e.g., `PricingPage`, `ContactPage`, `SignInPage`)

Contains:
- JSON-LD `<script>` tags (public pages only)
- `<Main>` with all UI content
- Imports SEO schema functions from `features/{feature}/constants/{page}-seo.constant.ts`

```tsx
import type { WebPage, WithContext } from "schema-dts";

import { getPricingSchema } from "@/features/pricing/constants/pricing-seo.constant";

import { Main } from "@/components/main";

function PricingPage() {
  const webPageSchema = getPricingSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <Main>
        {/* content */}
      </Main>
    </>
  );
}

export { PricingPage };
```

## Global Page Components (P0)

Location: `components/pages/{name}-page.tsx`

For pages not tied to a feature: not-found, maintenance, error, sitemap.

```
components/pages/
├── not-found-page.tsx
├── maintenance-page.tsx
├── error-page.tsx          ← "use client" (useEffect, reset callback)
├── global-error-page.tsx   ← "use client" + <html><body> (replaces root layout)
└── sitemap-page.tsx
```

## SEO Constants (P0)

Location: `features/{feature}/constants/{page}-seo.constant.ts`

Contains: DESCRIPTION, KEYWORDS, schema getter functions.

```ts
import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

const PRICING_DESCRIPTION = `Découvrez les tarifs de ${APP_NAME}...`;
const PRICING_KEYWORDS = ["tarifs", "prix", APP_NAME.toLowerCase()];

function getPricingSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/tarifs/#webpage`,
    name: `Tarifs | ${APP_NAME}`,
    description: PRICING_DESCRIPTION,
    url: `${BASE_URL}/tarifs`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", "@id": `${BASE_URL}/#website` },
  };
}

export { getPricingSchema, PRICING_DESCRIPTION, PRICING_KEYWORDS };
```

## Main Component (P0)

Use `<Main>` from `@/components/main` instead of raw `<main>`.

Defaults: `bg-background min-h-screen w-full`

Override via `className` (Tailwind Merge handles conflicts):

```tsx
<Main>                                          {/* bg-background min-h-screen w-full */}
<Main className="flex items-center justify-center">  {/* adds flex */}
<Main className="bg-muted">                     {/* overrides bg */}
```

**Never** use raw `<main>` in feature page components (except `global-error-page.tsx`).

## Thin Shim Structure (P0)

### Public Page Shim

```tsx
import type { Metadata } from "next";

import { PricingPage } from "@/features/pricing/pages/pricing-page";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const DESCRIPTION = `Découvrez les tarifs de ${APP_NAME}...`;

export const metadata: Metadata = {
  title: "Tarifs",
  description: DESCRIPTION,
  keywords: ["tarifs", "prix", APP_NAME.toLowerCase()],
  alternates: {
    canonical: "/tarifs",
  },
  openGraph: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/tarifs",
  },
  twitter: {
    title: `Tarifs | ${APP_NAME}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PricingRoute() {
  return <PricingPage />;
}
```

### Public Page Shim (with props)

```tsx
export default async function PricingRoute() {
  const session = await getSession();
  const { isAuthenticated, isEmailVerified, isCustomer } =
    await getPricingUserStatus(session?.user.id ?? null);

  return (
    <PricingPage
      isAuthenticated={isAuthenticated}
      isEmailVerified={isEmailVerified}
      isCustomer={isCustomer}
    />
  );
}
```

### Public Page Shim (with conditional render)

```tsx
export default async function DashboardBillingRoute() {
  const session = await requireCustomerVerifiedEmail();
  const billing = await getBilling(session.user.id);

  if (!billing) {
    return <BillingEmptyPage />;
  }

  return <BillingPage billing={billing} />;
}
```

### Protected Page Shim

```tsx
import type { Metadata } from "next";

import { SettingsPage } from "@/features/account/pages/settings-page";

import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardSettingsRoute() {
  const session = await requireSession();

  return (
    <SettingsPage
      user={{
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
      }}
    />
  );
}
```

## Metadata Format (P0)

Always use **expanded multi-line** format for nested objects:

```tsx
// ✅ Correct
robots: {
  index: true,
  follow: true,
},
alternates: {
  canonical: "/path",
},

// ❌ Wrong
robots: { index: true, follow: false },
alternates: { canonical: "/path" },
```

```tsx
// ✅ Correct
dangerouslySetInnerHTML={{
  __html: JSON.stringify(schema),
}}

// ❌ Wrong
dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
```

**Public pages** — required fields:
`title`, `description`, `keywords`, `alternates`, `openGraph`, `twitter`, `robots: { index: true, follow: true }`

**Protected pages** — only:
`title`, `robots: { index: false, follow: false }`

## Auth Guards (P0)

| Guard | Usage |
|---|---|
| `requireSession()` | Any authenticated user |
| `requireCustomer()` | Customer role |
| `requireCustomerVerifiedEmail()` | Customer with verified email |
| `requireAdmin()` | Admin role |
| `requireAdminVerifiedEmail()` | Admin with verified email |

## Loading Pages (P0)

### Loading Shim (`app/*/loading.tsx`)

```tsx
import { PricingLoading } from "@/features/pricing/pages/pricing-loading";

export default function PricingLoadingRoute() {
  return <PricingLoading />;
}
```

### Feature Loading Component (`features/{feature}/pages/{name}-loading.tsx`)

- Named: `{Feature}Loading`
- Use `<Main aria-busy="true" aria-label="Chargement...">`
- Use `Skeleton` from `@/components/ui/skeleton`
- Mirror the layout of the corresponding page component
- NO data fetching, NO async/await, NO metadata

```tsx
import { Skeleton } from "@/components/ui/skeleton";

import { Main } from "@/components/main";

function PricingLoading() {
  return (
    <Main aria-busy="true" aria-label="Chargement...">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {Array.from({ length: 3 }).map((_, index: number) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    </Main>
  );
}

export { PricingLoading };
```

## Anti-Patterns

```tsx
// ❌ French route function name
export default function TarifsRoute() { ... }
// ✅ export default function PricingRoute() { ... }

// ❌ JSX in route file
export default function PricingRoute() {
  return (
    <main>           // ❌ UI in route file
      <h1>Tarifs</h1>
    </main>
  );
}

// ❌ JSON-LD in route file
export default function PricingRoute() {
  const schema = { ... };  // ❌ belongs in feature page component
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PricingPage />
    </>
  );
}

// ❌ Raw <main> in feature page component
function PricingPage() {
  return <main>...</main>;   // ❌ use <Main>
}

// ❌ bg-background in feature page (already in Main)
<Main className="bg-background flex ...">  // ❌
<Main className="flex ...">                // ✅

// ❌ Inline robots/alternates format
robots: { index: true, follow: true },          // ❌
alternates: { canonical: "/tarifs" },            // ❌

// ❌ Inline dangerouslySetInnerHTML
dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}  // ❌

// ❌ Loading without Main
function PricingLoading() {
  return (
    <main aria-busy="true">  // ❌ use <Main>
      <Skeleton />
    </main>
  );
}

// ❌ Metadata in loading file
export const metadata = { title: "Loading..." };  // ❌ never

// ❌ Default export in feature page component
export default function PricingPage() { ... }  // ❌ always named export
```
