# Architecture

A map of how this codebase is organized and why — not a copy of the machine-enforced rules in `.claude/rules/*.md`. Read those for the letter of the law; read this for the shape of the forest.

The worked example throughout is `features/projects` — a complete, real CRUD domain (not a stub) built specifically to be copied when adding a new domain.

## Layout

```
app/                          # Routes only — thin shims, no business logic
├── (public)/                 # Marketing, auth, legal pages
├── (protected)/              # Dashboard + Admin (guarded by entry-point checks)
└── api/                      # Route handlers (Better Auth catch-all, avatar upload, Stripe webhooks)

features/                     # ALL business logic lives here, one folder per domain
└── {feature}/
    ├── actions/               # Server Actions (next-safe-action)
    ├── components/            # UI — forms/ and modals/ as dedicated subfolders
    ├── constants/              # Domain constants, Nuqs searchParams, filter/label maps
    ├── emails/                  # React Email templates
    ├── pages/                    # {Feature}Page + {Feature}Loading — the actual page content
    ├── schemas/                   # Zod validation (Create → Update → Delete order)
    └── services/                   # Server-only logic, security-scoped

lib/                          # Shared infrastructure: auth, prisma client, redis, env, r2, cache-keys
components/                   # Shared UI: ui/ (Shadcn primitives), pages/, public/, protected/
utils/                        # Pure utilities: errors/, date/, string/
hooks/                        # Shared React hooks
```

A route file under `app/` should almost always be a thin shim: parse `searchParams`/params, run entry-point guards (auth, rate limit, plan gate), call one service or action, and render a `{Feature}Page` from `features/{feature}/pages/`. If a route file is doing real logic, that logic is misplaced.

## Source-of-truth hierarchy

Everything is derived, never duplicated, in this order:

```
Prisma schema (enums ALWAYS UPPERCASE, e.g. ProjectStatus.ACTIVE)
  → lib/generated/prisma/client   (server-only: services, actions, api/)
    lib/generated/prisma/browser  (client-safe: constants/, components/)
  → lib/parsers/filters.ts (pure constants) + lib/parsers/nuqs.ts (Nuqs parsers)
  → features/*/constants/   (filter unions, searchParams objects, label maps)
  → features/*/schemas/     (Zod, validates against the same constants — never redefines them)
  → features/*/services/    (Prisma queries, security-scoped)
  → features/*/actions/     (next-safe-action wrapping a service)
  → features/*/components/  (forms, tables, modals)
  → app/*/page.tsx           (thin shim wiring it all together)
```

Concretely, for `features/projects`: `ProjectStatus` is defined once in `schema.prisma`, imported into `project-filters.constant.ts` from `prisma/browser`, referenced (not redefined) by `project.schema.ts`'s Zod enum, consumed by every service's `where` clause, exposed through the actions, and rendered via `projects-columns.tsx` / `projects-filters.tsx`. Change the enum in one place and every layer downstream is a type error until it's updated — that's the point.

## Feature slice anatomy (worked example: `features/projects`)

| Layer      | File                                                                                      | Responsibility                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema     | `schemas/project.schema.ts`                                                               | `CreateProjectSchema` → `UpdateProjectSchema` → `DeleteProjectSchema`, French error messages, `.min().max().trim()` chain order                                                      |
| Constants  | `constants/project-filters.constant.ts`                                                   | `ProjectStatusFilter` type, Nuqs `projectsSearchParams`, `projectStatusLabels` (`Record<Enum, string>`, never `Record<string, ...>`)                                                 |
| Service    | `services/get-project.service.ts`                                                         | The literal IDOR-safe pattern: `findFirst({ id, organizationId })`, re-checks membership even though the action layer already did, throws `NotFoundError` if absent or out of scope  |
| Service    | `services/get-projects.service.ts`                                                        | List query: explicit `select`, `take`, `$transaction([findMany, count])`                                                                                                             |
| Service    | `services/create-project.service.ts` / `update-...` / `delete-...`                        | Mutations, ownership re-verified before `update`/`delete`                                                                                                                            |
| Action     | `actions/create-project.action.ts` etc.                                                   | `"use server"` on line 1, built on `orgActionClient`, `.inputSchema()`, `revalidatePath("/dashboard/projets")` after mutation                                                        |
| Components | `components/projects-columns.tsx`, `projects-filters.tsx`, `projects-empty.tsx`           | TanStack Table columns, Nuqs-driven filters, a distinct empty state for "no data" vs. "no results for current filters"                                                               |
| Components | `components/forms/create-project-form.tsx` + `components/modals/create-project-modal.tsx` | Form and Modal are always separate files; the modal owns open/close state, the form calls `onSuccess` to close it                                                                    |
| Page       | `pages/projects-page.tsx` + `pages/projects-loading.tsx`                                  | The actual list page and its `loading.tsx` counterpart                                                                                                                               |
| Route      | `app/(protected)/dashboard/projets/page.tsx`                                              | Thin shim: `requireCustomerPlan("pro")` guard, Nuqs `createLoader`, `filterRatelimit` at the entry point, scopes the query to `session.activeOrganizationId`, renders `ProjectsPage` |

To build a new domain: copy this slice's file list, rename, and follow the same order (schema → constants → service → action → component → route).

## Security model

Three layers, each independently necessary:

1. **Entry-point guards** — `app/*/page.tsx` and `actions/*.action.ts` are where auth, plan gating, and rate limiting happen. `orgActionClient` / `authActionClient` / `adminActionClient` inject `ctx.userId`, `ctx.organizationId`, etc. after verifying session and (for org actions) membership. Rate limiting (`filterRatelimit`, `authenticatedRatelimit`, `contactRatelimit` from `lib/ratelimit.ts`) is applied **only** here — never inside a service.
2. **Service-level membership enforcement** — every service re-verifies what it needs (e.g. `prisma.member.findFirst({ organizationId, userId })`) even though the action layer already checked. A service is never allowed to trust its caller; it must be safe to call directly. This is what makes `get-project.service.ts` throw `ForbiddenError` before running any project query for a non-member, and `NotFoundError` for a project outside the caller's org.
3. **IDOR rules at the query level** — customer services always filter by the scoping key in the Prisma `where` clause (`userId` for user-owned data, `organizationId` for org-owned data) using `findFirst`/`findMany`, not `findUnique` on the id alone. Admin services live in a **separate** file with no scoping filter — access is guaranteed by the entry point (`requireAdmin()` / `adminActionClient`), and admin/customer logic is never mixed in one service.

`__tests__/features/projects/services/project-isolation.test.ts` is the reference proof: for every service, it asserts (a) a non-member is rejected before any Prisma query for the resource runs, and (b) a resource belonging to another organization returns `NotFoundError`, not the resource.

Booleans are never used for permissions (`isAdmin: boolean` is banned) — role/permission checks use the typed `UserRole` enum instead, since a boolean can't represent a future third role.

## Error handling

Error classes live in `utils/errors/errors.ts` — a small `AppError` hierarchy mapped to HTTP status codes 400 → 429 (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `PayloadTooLargeError`, `UnsupportedMediaTypeError`, `UnprocessableEntityError`, and rate-limit's 429). Services throw these directly; nothing downstream swallows them silently.

| Layer             | Pattern                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services          | Throw the appropriate `AppError` subclass directly — no try/catch                                                                                                                         |
| Actions           | No try/catch either — `next-safe-action`'s `handleServerError` (in `lib/safe-action.ts`) catches whatever the service threw and serializes it to the client                               |
| API routes        | `catch (error: unknown)` at the top level, passed to `handleApiError(error)` from `utils/errors/handle-api-error.ts`, which maps it to the right HTTP response                            |
| Client components | `getActionResult(await executeAsync(value))` inside a try/catch, paired with `getErrorMessage(error)` for the toast message — this is the only place error handling happens on the client |

## Caching approach

Three layers you choose per case, plus two library-managed caches you only configure:

| Layer                     | Scope                       | When                                                                                                                                                                                                                                                        |
| ------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React `cache()`           | Per-request dedup           | Same function called 2+ times in one render (e.g. `getSession()` used in a page, its layout, and a guard)                                                                                                                                                   |
| Next.js `"use cache"`     | Cross-request, shared       | Expensive queries whose result is the same for every caller (e.g. an admin dashboard aggregate); always paired with an explicit `cacheLife()` and a `cacheTag()` for invalidation, and always kept alongside a non-cached pure function for real-time reads |
| Redis                     | External-API data, per-user | Data fetched from Stripe etc. that's invalidated by webhooks; keys are centralized in `lib/cache-keys.ts` (never string literals)                                                                                                                           |
| Better Auth `cookieCache` | Session in signed cookie    | Config-only (`maxAge` in `lib/auth.ts`), avoids a DB round-trip per request                                                                                                                                                                                 |
| Upstash Ratelimit         | Request counters            | Config-only (`lib/ratelimit.ts`)                                                                                                                                                                                                                            |

`"use cache"` is a function-level directive only — never on a page route — and is always the first statement in the function body, immediately followed by `cacheLife()` and `cacheTag()`. Functions using `headers()`/`cookies()`/`searchParams` can never carry `"use cache"`; that data belongs in a `<Suspense>` boundary instead (the PPR pattern: a static shell rendered at build time, with a dynamic hole for anything session- or request-scoped).

## Testing approach

Tests live in `__tests__/`, mirroring the `features/` tree (`__tests__/features/{feature}/{schemas,services}/...`). The suite is Vitest, currently 560+ tests across 46 files, run with `pnpm test` (CI's `test` job) and gating the `build` job.

Conventions demonstrated by `__tests__/features/projects/`:

- **Schema tests** — boundary values (min/max length, invalid enum) for every Zod schema, one file per schema group.
- **Service isolation tests** — for each service, prove a non-member is rejected before touching the resource table, and a resource in a different organization comes back as `NotFoundError` rather than leaking through. This is the concrete deliverable for "IDOR-safe" — not a code comment, a test that fails if the `where` clause regresses.
- No action-level test pattern exists yet in this repo (the one exception is a utility test for `get-action-result`); the security-relevant logic is fully exercised at the service layer, so new domains should follow the service-test pattern first and add action tests only if the action itself grows real branching logic.

## Where to go next

- Machine-enforced, path-scoped rules: `.claude/rules/feature.md`, `action.md`, `api.md`, `page.md`, `form.md`, `filter.md`, `security.md`, `seed.md`, `cache.md`, `code-style.md`.
- Roadmap and audit history: `aidd_docs/tasks/2026_07/`.
