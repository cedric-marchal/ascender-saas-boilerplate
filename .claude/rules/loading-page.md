# Loading Page Creation Rules

## Context

These rules apply exclusively to creating new `loading.tsx` files in the Next.js App Router structure. Loading files provide instant visual feedback while route segments are being loaded.

## Rules

### 1. Function Naming (P0)

- The exported function name MUST use English semantic names in PascalCase + `Loading`
- For French URL paths, use the English equivalent for the function name
- Protected pages MUST include their section prefix (`Dashboard`, `Admin`)
- MUST use default export
- Examples:
  - `app/(public)/blog/loading.tsx` → `BlogLoading`
  - `app/(public)/tarifs/loading.tsx` → `PricingLoading`
  - `app/(public)/(auth)/connexion/loading.tsx` → `SignInLoading`
  - `app/(protected)/dashboard/loading.tsx` → `DashboardLoading`
  - `app/(protected)/dashboard/parametres/loading.tsx` → `DashboardSettingsLoading`
  - `app/(protected)/dashboard/facturation/loading.tsx` → `DashboardBillingLoading`
  - `app/(protected)/admin/utilisateurs/loading.tsx` → `AdminUsersLoading`

```tsx
// ✅ Correct
export default function BlogLoading() { ... }
export default function DashboardSettingsLoading() { ... }
export default function AdminUsersLoading() { ... }

// ❌ Wrong
export default function Loading() { ... }
export function BlogLoading() { ... }
export default function ParametresLoading() { ... } // Should use English: SettingsLoading
```

### 2. Structure (P0)

- The top-level returned element MUST be a `<main>` tag (consistency with `page.tsx`)
- MUST use Skeleton components from `@/components/ui/skeleton` (Shadcn/ui)
- Loading UI MUST mirror the layout structure of the corresponding `page.tsx`
- MUST be responsive for three screen types: desktop, tablet, mobile

### 3. Skeleton Design (P1)

- Skeletons MUST reflect the actual content structure of the page
- Use appropriate skeleton shapes:
  - `Skeleton` with `h-*` and `w-*` for text blocks
  - `Skeleton` with `rounded-full` for avatars/icons
  - `Skeleton` with `aspect-video` or `aspect-square` for images/cards
- Group related skeletons to match component boundaries
- Maintain consistent spacing with the actual page layout

### 4. No Data Fetching (P0)

- Loading components MUST NOT fetch data
- Loading components MUST NOT use async/await
- Loading components MUST NOT import server-only utilities

```tsx
// ✅ Correct
export default function DashboardLoading() {
  return <main>...</main>;
}

// ❌ Wrong
export default async function DashboardLoading() {
  await someData();
  return <main>...</main>;
}
```

### 5. No Metadata (P0)

- Loading files MUST NOT export metadata
- Loading files MUST NOT include JSON-LD scripts

### 6. Accessibility (P1)

- Add `aria-busy="true"` on the `<main>` element
- Add `aria-label` describing the loading state
- Use `sr-only` text for screen readers when appropriate

## Examples

### Public Page Loading

`app/(public)/blog/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement des articles"
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index: number) => (
          <article key={index} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </article>
        ))}
      </div>
    </main>
  );
}
```

### Dashboard Page Loading

`app/(protected)/dashboard/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
      className="flex min-h-screen flex-col gap-6 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index: number) => (
          <div key={index} className="space-y-2 rounded-lg border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </main>
  );
}
```

### Admin Page Loading

`app/(protected)/admin/users/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la liste des utilisateurs"
      className="flex min-h-screen flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="rounded-lg border">
        <div className="flex gap-4 border-b p-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {Array.from({ length: 8 }).map((_, index: number) => (
          <div key={index} className="flex items-center gap-4 border-b p-4">
            <Skeleton className="h-4 w-8" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </main>
  );
}
```

## Anti-Patterns

```tsx
// ❌ Wrong: Generic name instead of path-based
export default function Loading() {
  return <main>...</main>;
}

// ❌ Wrong: Not using default export
export function BlogLoading() {
  return <main>...</main>;
}

// ❌ Wrong: Top-level element is not <main>
export default function BlogLoading() {
  return <div>Loading...</div>;
}

// ❌ Wrong: Using async function
export default async function DashboardLoading() {
  return <main>...</main>;
}

// ❌ Wrong: Not using Shadcn/ui Skeleton
export default function BlogLoading() {
  return (
    <main>
      <div className="h-4 w-32 animate-pulse bg-gray-200" />
    </main>
  );
}

// ❌ Wrong: Generic loading without structure
export default function DashboardLoading() {
  return (
    <main className="flex items-center justify-center">
      <span>Chargement...</span>
    </main>
  );
}

// ❌ Wrong: Missing accessibility attributes
export default function BlogLoading() {
  return (
    <main>
      <Skeleton className="h-4 w-32" />
    </main>
  );
}

// ❌ Wrong: Exporting metadata
export const metadata = { title: "Loading..." };

export default function DashboardLoading() {
  return <main>...</main>;
}
```

## Placement Guidelines

| Route Type       | Loading File Location                              | Function Name (English)       |
| ---------------- | -------------------------------------------------- | ----------------------------- |
| Public pages     | `app/(public)/[route]/loading.tsx`                 | `{EnglishRoute}Loading`       |
| Dashboard pages  | `app/(protected)/dashboard/[route]/loading.tsx`    | `Dashboard{EnglishRoute}Loading` |
| Admin pages      | `app/(protected)/admin/[route]/loading.tsx`        | `Admin{EnglishRoute}Loading`  |
| Shared dashboard | `app/(protected)/dashboard/loading.tsx`            | `DashboardLoading`            |

## Key Principles

1. **Mirror the page structure**: Skeletons should match the actual layout
2. **Instant feedback**: Loading UI appears immediately during navigation
3. **Consistency**: Use the same spacing, sizing, and structure as the real content
4. **Accessibility**: Always include ARIA attributes for assistive technologies
5. **English naming**: Function names use English equivalents regardless of French URL paths
```