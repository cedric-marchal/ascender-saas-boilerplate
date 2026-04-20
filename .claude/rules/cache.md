---
paths:
  - "features/*/services/**"
  - "features/*/pages/**"
  - "features/*/components/**"
  - "app/**/page.tsx"
  - "lib/cache-keys.ts"
  - "lib/redis.ts"
---

# Cache Rules — `"use cache"`, Redis & PPR

## Context

### Cache Architecture — 3 Layers You Control + 2 Library Caches

**Your architecture decisions (you choose which to use):**

| Layer                 | Role                              | When to use                                                     | Invalidation                     |
| --------------------- | --------------------------------- | --------------------------------------------------------------- | -------------------------------- |
| React `cache()`       | Per-request dedup (user-scoped)   | Same function called 2+ times in one render                     | Automatic (per-request)          |
| Next.js `"use cache"` | Persistent cross-request (shared) | Expensive queries, same result for all users                    | `revalidateTag()` from your code |
| Redis                 | External data cache (per-user)    | Data from external APIs (Stripe) invalidated by external events | `redis.del()` from webhooks      |

**Library-managed caches (configuration only, not your architecture):**

| Library                   | What it caches                                 | Config                                |
| ------------------------- | ---------------------------------------------- | ------------------------------------- |
| Better Auth `cookieCache` | Session data in signed cookie (avoids DB call) | `maxAge: 60` in `lib/auth.ts`         |
| Upstash Ratelimit         | Request counters per identifier                | `slidingWindow` in `lib/ratelimit.ts` |

## `"use cache"` — Function-Level Only (P0)

ALWAYS place `"use cache"` on **async functions or components**, NEVER on page routes.

### Naming: Pure + Cached Wrapper (P0)

ALWAYS separate the pure query from the cached wrapper. The default name = pure (no surprise), the cached version = explicit opt-in with `getCached` prefix.

```tsx
// ✅ Correct: pure function + cached wrapper in the SAME file

// Pure — real-time data, no magic
async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  // ... Prisma queries
}

// Cached — explicit opt-in, calls the pure function
async function getCachedAdminDashboard(): Promise<AdminDashboardMetrics> {
  "use cache";

  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("admin-dashboard");

  return getAdminDashboard();
}

export { getAdminDashboard, getCachedAdminDashboard };
```

Entry points choose what they need:

| Entry point             | Function                    | Data                       |
| ----------------------- | --------------------------- | -------------------------- |
| Page (display)          | `getCachedAdminDashboard()` | Cached (acceptable for UI) |
| API export / monitoring | `getAdminDashboard()`       | Real-time                  |
| Action forced refresh   | `getAdminDashboard()`       | Real-time                  |

```tsx
// ❌ Wrong: page-level cache
export default async function AdminRoute() {
  "use cache"; // NEVER here

  return <AdminPage />;
}

// ❌ Wrong: cache baked into the only function (no pure alternative)
async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  "use cache"; // blocks real-time access
  // ...
}
```

### Rules

1. `"use cache"` MUST be the **first statement** in the function body
2. `cacheLife()` MUST follow immediately (NEVER use default — always explicit)
3. `cacheTag()` MUST follow for invalidation support
4. Function MUST be `async`
5. Return value MUST be serializable (primitives, plain objects, arrays, `Date`)
6. NEVER use `headers()`, `cookies()`, `searchParams` inside `"use cache"` — defer to Suspense
7. ALWAYS keep a pure version alongside the cached wrapper — NEVER cache the only available function

### Imports

```tsx
import { cacheLife, cacheTag } from "next/cache";
```

### `cacheLife` Profiles

Use custom objects for explicit control, not presets:

```tsx
// ✅ Correct: explicit values
cacheLife({ stale: 60, revalidate: 300, expire: 3600 });

// ❌ Wrong: opaque preset
cacheLife("hours");
```

| Parameter    | Meaning                                                         |
| ------------ | --------------------------------------------------------------- |
| `stale`      | Seconds to serve from cache without checking server             |
| `revalidate` | Seconds between background revalidation                         |
| `expire`     | Hard expiration — cache discarded, next request waits for fresh |

## PPR — Partial Pre-Rendering (P0)

For pages mixing static + dynamic content, use **Suspense** to create dynamic holes.

### Pattern: Static Shell + Dynamic Hole

```tsx
// app/(public)/tarifs/page.tsx — sync, NO "use cache"
export default function PricingRoute() {
  return (
    <PricingPage>
      <Suspense fallback={<PricingGridSkeleton />}>
        <PricingCta /> {/* async: calls getSession() → headers() */}
      </Suspense>
    </PricingPage>
  );
}
```

- **Page route** = sync, no data fetching, no `"use cache"`
- **Static component** (`PricingPage`) = rendered at build → CDN
- **Dynamic component** (`PricingCta`) = inside `<Suspense>`, runs per request, contains Dynamic APIs (`headers()`, `cookies()`)
- **Skeleton** = shown instantly while dynamic part streams

### When to use PPR

| Page has...                                | Pattern                                   |
| ------------------------------------------ | ----------------------------------------- |
| No dynamic data                            | No cache needed (already static at build) |
| Only dynamic data (session, user-scoped)   | Normal async page, no PPR                 |
| Mix of static layout + dynamic user data   | PPR with Suspense                         |
| Expensive shared queries (admin dashboard) | `"use cache"` on the service function     |

## Redis Cache Keys (P0)

ALL Redis cache keys MUST be centralized in `lib/cache-keys.ts`. NEVER use string literals.

```tsx
// ✅ Correct: centralized key
import { billingInvoicesCacheKey } from "@/lib/cache-keys";

const cacheKey = billingInvoicesCacheKey(userId);

// ❌ Wrong: string literal
const cacheKey = `invoices:${userId}`;
```

### Adding a New Redis Cache Key

1. Add the function in `lib/cache-keys.ts`
2. Use it in both the **set** (service) and **del** (webhook/cleanup) locations
3. Verify no string literal duplicates remain

### Current Keys

| Function                                  | Key Format               | Used By                                     |
| ----------------------------------------- | ------------------------ | ------------------------------------------- |
| `billingInvoicesCacheKey(userId)`         | `invoices:{userId}`      | get-billing, handle-webhook, delete-account |
| `billingSubscriptionsCacheKey(userId)`    | `subscriptions:{userId}` | get-billing, handle-webhook, delete-account |
| `stripeEventIdempotencyCacheKey(eventId)` | `stripe:event:{eventId}` | handle-webhook                              |

## React `cache()` — Per-Request Deduplication (P0)

Wrap a service function with React `cache()` when it will be called **multiple times in the same render** (e.g., in both `generateMetadata()` and the page component, or in a page + layout).

### When to use React `cache()`

| Condition                                                                | Use React `cache()` ?              |
| ------------------------------------------------------------------------ | ---------------------------------- |
| Function called 2+ times in same render (page + metadata, page + layout) | **Yes**                            |
| Function called once per render                                          | **No** — unnecessary overhead      |
| Function needs cross-request persistent cache                            | **No** — use `"use cache"` instead |

### Pattern

```tsx
import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

// Wrap with cache() — deduplicates within a single request
const getUserBySlug = cache(
  async (slug: string): Promise<GetUserResult | null> => {
    return prisma.user.findUnique({
      where: { slug },
      select: { ... },
    });
  },
);

export { getUserBySlug };
```

### Current usages

| Function                  | File                         | Why                                                 |
| ------------------------- | ---------------------------- | --------------------------------------------------- |
| `getSession()`            | `lib/session.ts`             | Called in page + layout + guards within same render |
| `getActiveSubscription()` | `lib/session.ts`             | Called alongside session in same render             |
| `getPricingUserStatus()`  | `features/pricing/services/` | Called in metadata + page                           |
| `getUserBySlug()`         | `features/users/services/`   | Called in metadata + page                           |

### Rules

1. ONLY use on functions called **2+ times in the same render**
2. Import from `"react"`, NOT from `"next/cache"`
3. File MUST have `import "server-only"` (React `cache()` is server-only)
4. Arguments are the cache key — same args = same result within the request
5. NEVER combine React `cache()` with `"use cache"` on the same function

## React `cache()` vs `"use cache"` — Decision Table (P0)

|           | `cache()` (React)                                  | `"use cache"` (Next.js)                                                     |
| --------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Import    | `import { cache } from "react"`                    | Directive in function body                                                  |
| Scope     | **Per-request** deduplication                      | **Cross-request** persistent cache                                          |
| Use case  | Avoid duplicate DB calls in same render            | Cache expensive queries across users/requests                               |
| Data type | User-scoped (session, profile)                     | Shared/aggregated (metrics, counts)                                         |
| Example   | `getSession()` called in page + layout → 1 DB call | `getCachedAdminDashboard()` called by multiple admins → 1 DB call per 5 min |

## Anti-Patterns

```tsx
// ❌ "use cache" on page route
export default async function Route() {
  "use cache";
}

// ❌ "use cache" without cacheLife (relies on opaque defaults)
async function getData() {
  "use cache";
  // missing cacheLife()
}

// ❌ "use cache" without cacheTag (no invalidation possible)
async function getData() {
  "use cache";

  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  // missing cacheTag()
}

// ❌ headers()/cookies() inside "use cache"
async function getData() {
  "use cache";

  const session = await getSession(); // calls headers() → ERROR
}

// ❌ Redis key as string literal
const cacheKey = `invoices:${userId}`;

// ❌ Confusing React cache() with "use cache"
const getData = cache(async () => { ... }); // per-request only, not persistent
```
