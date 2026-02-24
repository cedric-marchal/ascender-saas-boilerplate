# Feature Module Rules

## Context

Feature-based architecture: ALL business logic lives in `features/{feature}/`. Pages in `app/` import from features.

## Structure (P0)

```
features/{feature}/
├── actions/          # Server Actions ("use server", next-safe-action)
│   └── {verb}-{entity}.action.ts
├── components/       # UI components
│   ├── forms/        # Forms (TanStack Form + Zod)
│   │   └── {entity}-form.tsx
│   ├── modals/       # Modals (Dialog wrapper, imports form)
│   │   └── {entity}-modal.tsx
│   └── *.tsx         # Other components
├── constants/        # Domain-specific constants (filters, searchParams)
│   └── {entity}-filters.constant.ts
├── emails/           # React Email templates
│   └── {entity}-email.tsx
├── hooks/            # Feature-specific hooks
│   └── use-{feature}.ts
├── schemas/          # Zod validation schemas
│   └── {entity}.schema.ts
└── services/         # Server-only business logic ("server-only")
    └── {verb}-{entity}.service.ts
```

## Naming (P0)

| Type      | Pattern                  | File                         | Example                                            |
| --------- | ------------------------ | ---------------------------- | -------------------------------------------------- |
| Schema    | `{Action}{Entity}Schema` | `{entity}.schema.ts`         | `CreateContactSchema` → `contact.schema.ts`        |
| Type      | `{SchemaName}Type`       | (same file)                  | `CreateContactSchemaType`                          |
| Action    | `{verb}{Entity}Action`   | `{verb}-{entity}.action.ts`  | `createContactAction` → `create-contact.action.ts` |
| Service   | `{verb}{Entity}`         | `{verb}-{entity}.service.ts` | `createContact` → `create-contact.service.ts`      |
| Component | `{Name}` (PascalCase)    | `{name}.tsx` (kebab-case)    | `ContactForm` → `contact-form.tsx`                 |
| Form      | `{Entity}Form`           | `{entity}-form.tsx`          | `ProfileForm` → `profile-form.tsx`                 |
| Modal     | `{Entity}Modal`          | `{entity}-modal.tsx`         | `DeleteAccountModal` → `delete-account-modal.tsx`  |
| Email     | `{Entity}Email`          | `{entity}-email.tsx`         | `WelcomeEmail` → `welcome-email.tsx`               |

## Schema Rules (P0)

**Location**: `features/{feature}/schemas/{entity}.schema.ts`

**Order**: Create → Update → Delete (matching POST → PATCH → DELETE)

**String chain**: `.min() → .max() → .trim()` (always this order, always French messages)

**Export**: schemas first, then types. Named exports only.

**Structure**:

```tsx
import { z } from "zod";

const CreateContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "L'email doit contenir moins de 255 caractères")
    .trim()
    .email("L'email est invalide"),
});

const UpdateContactSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Max 200 caractères")
    .trim(),
});

type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;
type UpdateContactSchemaType = z.infer<typeof UpdateContactSchema>;

export { CreateContactSchema, UpdateContactSchema };
export type { CreateContactSchemaType, UpdateContactSchemaType };
```

**Rules**:

- Number: `.min() → .max()` (always with French messages)
- Constants: internal only (not exported)
- Types: always `{SchemaName}Type`
- File: one entity per file

## Service Rules (P0)

**Location**: `features/{feature}/services/{verb}-{entity}.service.ts`

**Protection**: MUST use `import "server-only"` at top

**Security (IDOR Prevention)**:

- **CRITICAL**: EVERY service MUST receive `userId: string` AND `userRole: UserRole`
- **NEVER** use booleans (`isAdmin`, `isCustomer`, etc.) for permissions
- **ALWAYS** import `UserRole` from `@/lib/constants/roles.constant`
- **ALWAYS** define `UNRESTRICTED_ROLES` constant listing roles with full data access
- **ALWAYS** filter by `userId` UNLESS user role is in `UNRESTRICTED_ROLES`

**Prisma**:

- Always `select` + `take` on `findMany`
- `$transaction` for parallel count + findMany
- Re-validate all params server-side (defense in depth)

**Structure (Generic Entity)**:

```tsx
import "server-only";

import {
  type UserSortableField,
  isUserRole,
} from "@/features/users/constants/users-filters.constant";

import { UserRole } from "@/lib/constants/roles.constant";
import type { User } from "@/lib/generated/prisma/client";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  MAX_SEARCH_LENGTH,
  type SortOrder,
} from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

// ✅ Define roles that can access ALL data (not just their own)
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getEntities(
  filters: GetEntitiesFilters,
  userId: string, // ✅ MANDATORY: Current user ID
  userRole: UserRole, // ✅ MANDATORY: Current user role (NEVER boolean)
): Promise<GetEntitiesResult> {
  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));

  // ✅ Check if user can access all data
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);

  const whereClause = {
    // ✅ Filter by userId UNLESS user is in UNRESTRICTED_ROLES
    ...(!canAccessAllData && { userId }),
    ...(safeSearch && {
      name: { contains: safeSearch, mode: "insensitive" as const },
    }),
  };

  const [entities, totalCount] = await prisma.$transaction([
    prisma.entity.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true },
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.entity.count({ where: whereClause }),
  ]);

  return { entities, totalCount, totalPages, currentPage: safePage };
}

export { getEntities };
```

**Structure (Admin-Only Service)**:

For admin-only pages (like user management), still receive `userId` for rate limiting:

```tsx
import "server-only";

import { UserRole } from "@/lib/constants/roles.constant";
import { filterRatelimit } from "@/lib/ratelimit";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

async function getUsers(
  filters: GetUsersFilters,
  userId: string, // ✅ For rate limiting (not filtering)
): Promise<GetUsersResult> {
  // ✅ Rate limit per user (prevent abuse)
  await checkRatelimit(filterRatelimit, userId);

  const safeSearch = filters.search.slice(0, MAX_SEARCH_LENGTH).trim();
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));

  // ❌ NO userId filter (admin sees all users)
  const whereClause = {
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
  };

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

export { getUsers };
```

**Anti-Pattern (CRITICAL - Never Do This)**:

```tsx
// ❌ WRONG: Using boolean for permissions
async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  isAdmin: boolean = false, // ❌ NOT extensible, NOT type-safe
) {
  const whereClause = {
    ...(!isAdmin && { userId }), // ❌ What about MANAGER role?
  };
}

// ❌ WRONG: Missing userId parameter
async function getEntities(filters: GetEntitiesFilters) {
  const entities = await prisma.entity.findMany({
    where: { name: filters.search }, // ❌ IDOR vulnerability!
  });
}

// ❌ WRONG: Not filtering by userId for non-admin
async function getEntities(
  filters: GetEntitiesFilters,
  userId: string,
  userRole: UserRole,
) {
  const entities = await prisma.entity.findMany({
    where: { name: filters.search }, // ❌ Missing userId check!
  });
}
```

## Action Rules (P0)

**Location**: `features/{feature}/actions/{verb}-{entity}.action.ts`

**Directive**: `"use server"` MUST be first line

**Client**: Use `actionClient` (public), `authActionClient` (auth), or `adminActionClient` (admin)

**Validation**: `.inputSchema(Schema)` — automatic validation, no manual parse

**Error handling**: No try/catch needed (next-safe-action handles it). Throw custom errors directly.

**Structure**:

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

**Auth example**:

```tsx
"use server";

import { UpdateProfileSchema } from "@/features/account/schemas/profile.schema";
import { updateProfile } from "@/features/account/services/update-profile.service";

import { authActionClient } from "@/lib/safe-action";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await updateProfile({ userId: ctx.userId, data: parsedInput });
    return { success: true, user };
  });
```

## Component Rules (P0)

**Naming**:

- Function: PascalCase (e.g., `ContactForm`)
- File: kebab-case (e.g., `contact-form.tsx`)
- Export: named only (never default)

**Server vs Client**:

- Server Component by default (no directive needed)
- `"use client"` only for: event handlers, hooks, browser APIs

**Props**:

- Inline if ≤2 props: `function Component({ a, b }: { a: string; b: number })`
- Separate `{Name}Props` type if >2 props
- Use `type` (never `interface`)

**Imports**:

- Combine types + values from same module: `import { value, type Type } from "module";`
- Type-only: `import type { Type } from "module";`
- NEVER separate imports from same module

**Structure**:

```tsx
import { type ChangeEvent, useState } from "react";

import type { User } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type UserFormProps = {
  user: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading: boolean;
};

function UserForm({ user, onSubmit, isLoading }: UserFormProps) {
  const [name, setName] = useState(user.name);

  if (!user.isActive) {
    return <UserFormDisabled />;
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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

export { UserForm };
```

**Rules**:

- `cn()` for conditional Tailwind classes
- `aria-hidden="true"` on decorative icons
- `type="button"` on all non-submit buttons
- Empty states: always separate `-empty.tsx` file
- Always type event handlers: `ChangeEvent<HTMLInputElement>`, `SubmitEvent<HTMLFormElement>`, etc.
- Always type callbacks: `.map((item: Item) => ...)`, `.map((_, index: number) => ...)`

## Form Rules (P0)

**Location**: `features/{feature}/components/forms/{entity}-form.tsx`

**Stack**: TanStack Form + Zod + next-safe-action

**Pattern**:

```tsx
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createContactAction } from "@/features/contact/actions/create-contact.action";
import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/features/contact/schemas/contact.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    } as CreateContactSchemaType,
    validators: {
      onSubmit: CreateContactSchema,
    },
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
      className="space-y-6"
    >
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="contact-name">Nom</FieldLabel>
              <Input
                id="contact-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Votre nom"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isExecuting || isSubmitting}
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting ? "Envoi..." : "Envoyer"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ContactForm };
```

**Rules**:

- Always TanStack Form (never react-hook-form)
- `validators: { onSubmit: Schema }` with imported Zod schema
- `defaultValues` with `as SchemaType` assertion
- `Field`, `FieldLabel`, `FieldError` from `@/components/ui/field`
- `form.Subscribe` for submit button state
- Prefer Server Actions over API Routes
- `getActionResult` + `getErrorMessage` in try/catch
- Reset form on success: `form.reset()`

## Modal Rules (P0)

**Location**: `features/{feature}/components/modals/{entity}-modal.tsx`

**Pattern**: Modal imports Form (always separate files)

```tsx
"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

import { DeleteAccountForm } from "@/features/account/components/forms/delete-account-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteAccountModalProps = {
  email: string;
};

function DeleteAccountModal({ email }: DeleteAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSuccess() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer votre compte</DialogTitle>
          <DialogDescription>Cette action est irréversible.</DialogDescription>
        </DialogHeader>
        <DeleteAccountForm email={email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccountModal };
```

**Rules**:

- Form and Modal MUST be separate files
- Modal manages dialog state (`isOpen`, `setIsOpen`)
- Form receives `onSuccess` callback to close modal

## Email Rules (P0)

**Location**: `features/{feature}/emails/{entity}-email.tsx`

**Stack**: React Email (`@react-email/components`)

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

type WelcomeEmailProps = {
  name: string;
};

function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif" }}>
        <Container>
          <Heading>Bienvenue {name} !</Heading>
          <Text>Merci de vous être inscrit.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export { WelcomeEmail };
```

## Constant Rules (P0)

**Global constants**: `lib/constants/*.constant.ts`

- `query.constant.ts` — pagination, filter, sort limits
- `roles.constant.ts` — UserRole enum + roleLabels (re-exported from Prisma)
- `subscription-status.constant.ts` — SubscriptionStatus + labels + ACTIVE_SUBSCRIPTION_STATUSES
- `invoice-status.constant.ts` — InvoiceStatus + labels (Stripe-only)

**Domain constants**: `features/{feature}/constants/{entity}-filters.constant.ts`

- Filter values (enums, arrays)
- `searchParams` object (uses parsers from `lib/parsers/nuqs.ts`)
- Type guards (`isUserRole`, etc.)
- Labels (extends global labels with filter-specific values like "all")

**Example**:

```tsx
import {
  UserRole,
  roleLabels as baseRoleLabels,
} from "@/lib/constants/roles.constant";
import {
  createEnumParser,
  createSortByParser,
  parseAsOrder,
  parseAsPage,
  parseAsSafeSearch,
} from "@/lib/parsers/nuqs";

type UserRoleFilter = "all" | UserRole;
const userRoleFilters = ["all", UserRole.ADMIN, UserRole.CUSTOMER] as const;

const roleLabels: Record<UserRoleFilter, string> = {
  all: "Tous les rôles",
  ...baseRoleLabels, // Reuse SSOT labels
};

const usersSearchParams = {
  search: parseAsSafeSearch.withDefault(""),
  role: createEnumParser(userRoleFilters).withDefault("all"),
  sortBy: createSortByParser(usersSortableFields).withDefault("createdAt"),
  order: parseAsOrder.withDefault("desc"),
  page: parseAsPage.withDefault(1),
};

function isUserRole(value: string): value is UserRole {
  return value === UserRole.ADMIN || value === UserRole.CUSTOMER;
}

export { isUserRole, roleLabels, userRoleFilters, usersSearchParams };
export type { UserRoleFilter };
```

## Anti-Patterns

```tsx
// ❌ Wrong file locations
lib/schemas/contact.schema.ts                    # → features/contact/schemas/
app/(public)/contact/_actions/                   # → features/contact/actions/
app/(protected)/dashboard/_lib/                  # → features/*/services/
components/emails/welcome-email.tsx              # → features/auth/emails/

// ❌ Wrong: Form and Modal in same file
function DeleteAccountModal() {
  const form = useForm({ ... });
  return <Dialog><form>...</form></Dialog>;
}

// ❌ Wrong: No "server-only" in service
// features/users/services/get-users.service.ts
import { prisma } from "@/lib/prisma";  // Missing "server-only"

// ❌ Wrong: No "use server" in action
// features/contact/actions/create-contact.action.ts
import { actionClient } from "@/lib/safe-action";  // Missing "use server"

// ❌ Wrong: Missing .trim() or wrong order
name: z.string().min(1).max(200);  // Missing .trim()
name: z.string().min(1).trim().max(200);  // Wrong order (trim before max)

// ❌ Wrong: Default export
export default function ContactForm() { ... }

// ❌ Wrong: Inline schema in action
export const createContactAction = actionClient
  .inputSchema(z.object({ name: z.string() }))  // Should import schema
  .action(async ({ parsedInput }) => { ... });

// ❌ Wrong: react-hook-form pattern
const form = useForm<SchemaType>({
  resolver: zodResolver(Schema),  // Wrong library
});
```

## Key Principles

1. **Feature-based organization** — All domain logic in `features/{feature}/`
2. **Named exports only** — Never default
3. **Server-only protection** — Services MUST use `import "server-only"`
4. **Use server directive** — Actions MUST use `"use server"` (line 1)
5. **Schema chain** — `.min().max().trim()` (always this order)
6. **Separation** — Form and Modal always separate files
7. **TanStack Form** — Always with Zod + `useAction` + `getActionResult` + `getErrorMessage`
8. **Type safety** — Explicit types everywhere, no implicit any
