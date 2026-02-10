# Server Action Creation Rules (next-safe-action)

## Context

These rules apply exclusively to creating Server Actions using **next-safe-action** in Next.js App Router. Server Actions are type-safe asynchronous functions that run on the server and can be called directly from Client Components.

## Rules

### 1. File Location & Naming (P0)

**Colocation Principle** : Place actions close to the components/pages that use them.

- File naming: `{verb}-{entity}.action.ts` (kebab-case with `.action.ts` suffix)
- One action per file (for clarity and maintainability)

#### Organization Rules:

| Action Scope       | Location                       | Example                                                                         |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------- |
| **Page-specific**  | `app/(group)/[page]/_actions/` | Contact form action → `app/(public)/contact/_actions/`                          |
| **Section-shared** | `app/(group)/_actions/`        | Profile/Password shared between dashboard & admin → `app/(protected)/_actions/` |
| **App-wide**       | `lib/actions/`                 | Global utilities (rare)                                                         |

```bash
# ✅ Correct: Colocation
app/(public)/contact/
├── _actions/
│   └── create-contact.action.ts      → createContactAction
├── _components/
│   └── contact-form.tsx
└── page.tsx

app/(protected)/
├── _actions/                          # Shared between dashboard & admin
│   ├── update-profile.action.ts      → updateProfileAction
│   ├── update-password.action.ts     → updatePasswordAction
│   └── delete-account.action.ts      → deleteAccountAction
├── dashboard/
│   └── parametres/
│       └── _components/
│           └── forms/                 # Uses (protected)/_actions/
└── admin/
    └── parametres/
        └── _components/
            └── forms/                 # Uses (protected)/_actions/

# ❌ Wrong: Centralized (old pattern)
app/actions/
├── create-contact.action.ts           # Should be in contact/_actions/
├── update-profile.action.ts           # Should be in (protected)/_actions/
└── delete-account.action.ts

# ❌ Wrong: Missing .action.ts suffix
app/(public)/contact/_actions/contact.ts

# ❌ Wrong: Multiple actions in one file
app/(public)/contact/_actions/contact-actions.ts
```

### 2. File Structure (P0)

Follow this exact order:

1. `"use server"` directive (MUST be first line)
2. _(empty line)_
3. Imports (Next.js → next-safe-action → libs → schemas → components → utils)
4. _(empty line)_
5. Action definition with next-safe-action
6. _(empty line)_
7. Export (named export only)

```tsx
// 1. Directive (LINE 1 - MANDATORY)
"use server";

// 2. Imports
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { authActionClient } from "@/lib/safe-action";
import { CreateContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

import { ConflictError } from "@/utils/errors/errors";

// 3. Action definition
export const createContactAction = authActionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Business logic here
    const document = await prisma.document.create({
      data: {
        ...parsedInput,
        userId: ctx.userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/dashboard");

    return { success: true, document };
  });
```

### 3. Naming Conventions (P0)

- Function name: `{verb}{Entity}Action` (camelCase)
- File name: `{verb}-{entity}.action.ts` (kebab-case)
- ALWAYS use Action suffix
- Use descriptive verbs: `create`, `update`, `delete`, `toggle`, `archive`, etc.

| Verb      | Usage                    | Example                    |
| --------- | ------------------------ | -------------------------- |
| `create`  | Create new resource      | `createContactAction`      |
| `update`  | Update existing resource | `updateProfileAction`      |
| `delete`  | Delete resource          | `deleteAccountAction`      |
| `toggle`  | Toggle boolean state     | `toggleSubscriptionAction` |
| `archive` | Archive resource         | `archiveProjectAction`     |
| `send`    | Send email/notification  | `sendVerificationAction`   |

```tsx
// ✅ Correct
export const createContactAction = ...
export const updateProfileAction = ...
export const deleteAccountAction = ...
export const toggleSubscriptionAction = ...

// ❌ Wrong
export const createContact = ...        // Missing "Action" suffix
export const contactCreate = ...        // Wrong order
export const create = ...               // Too generic
export const handleContactCreation = ...// Use "create" not "handle"
```

### 4. Action Client Selection (P0)

Choose the appropriate client based on authentication requirements:

| Client              | Usage                             | Context Provided                             |
| ------------------- | --------------------------------- | -------------------------------------------- |
| `actionClient`      | Public actions (no auth required) | None                                         |
| `authActionClient`  | Protected actions (auth required) | `userId`, `userEmail`, `userName`            |
| `adminActionClient` | Admin-only actions                | `userId`, `userEmail`, `userName`, `isAdmin` |

```tsx
// ✅ Public action (no auth)
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    // No ctx available
    await sendEmail({ ... });
    return { success: true };
  });

// ✅ Protected action (auth required)
export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId, ctx.userEmail, ctx.userName available
    await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,
    });
    return { success: true };
  });

// ✅ Admin action (admin only)
export const deleteUserAction = adminActionClient
  .inputSchema(DeleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId, ctx.userEmail, ctx.userName, ctx.isAdmin available
    await prisma.user.delete({
      where: { id: parsedInput.userId },
    });
    return { success: true };
  });
```

### 5. Schema Validation (P0)

- ALWAYS use `.inputSchema()` for input validation
- Import schema from `@/lib/schemas/`
- Validation is automatic, no need for manual `parse()`
- `parsedInput` is typed and validated automatically

```tsx
// ✅ Correct: Automatic validation
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema) // ← Validates automatically
  .action(async ({ parsedInput }) => {
    // parsedInput is typed as CreateContactSchemaType
    // and already validated ✅
    await sendEmail({
      to: parsedInput.email,
      subject: parsedInput.subject,
      message: parsedInput.message,
    });
    return { success: true };
  });

// ❌ Wrong: Manual validation (not needed)
export const createContactAction = actionClient
  .action(async ({ parsedInput }) => {
    const data = CreateContactSchema.parse(parsedInput); // ❌ Redundant
    // ...
  });
```

### 6. Error Handling (P0)

- NO try/catch needed (handled by next-safe-action)
- Throw custom errors directly (ConflictError, NotFoundError, etc.)
- Errors are caught and formatted by `handleServerError` in `lib/safe-action.ts`

```tsx
// ✅ Correct: Throw errors directly
export const createContactAction = authActionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existing = await prisma.contact.findUnique({
      where: { email: parsedInput.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictError("Cette adresse email est déjà enregistrée");
    }

    const contact = await prisma.contact.create({
      data: {
        ...parsedInput,
        userId: ctx.userId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return { success: true, contact };
  });

// ❌ Wrong: Manual try/catch (not needed)
export const createContactAction = authActionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      // ...
      return { success: true };
    } catch (error: unknown) {
      // ❌ Not needed, next-safe-action handles this
      return handleActionError(error);
    }
  });
```

### 7. Return Values (P0)

- Return plain objects (no NextResponse)
- next-safe-action wraps return in `{ data: <your_return> }`
- Keep return values simple and typed

```tsx
// ✅ Correct: Simple object return
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await sendEmail({ ... });
    return { success: true }; // ← Simple object
  });

// ✅ Correct: Return with data
export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return { success: true, user }; // ← Returns data
  });

// ❌ Wrong: NextResponse (not needed)
return NextResponse.json({ success: true }); // ❌ Not for Server Actions
```

### 8. Middleware (P1)

Use `.use()` for action-specific middleware (rate limiting, logging, etc.):

```tsx
export const createContactAction = actionClient
  .use(async ({ next }) => {
    // Rate limiting middleware
    await checkRatelimit(contactRatelimit, "identifier");
    return next();
  })
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await sendEmail({ ... });
    return { success: true };
  });
```

### 9. Revalidation (P1)

- Use `revalidatePath()` or `revalidateTag()` when data changes
- Call AFTER mutation, BEFORE return

```tsx
import { revalidatePath } from "next/cache";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,
    });

    revalidatePath("/dashboard/settings"); // ← Revalidate after mutation

    return { success: true, user };
  });
```

### 10. Prisma Queries (P0)

- ALWAYS use `select` to specify returned fields
- Use `Promise.all` for parallel independent queries
- NEVER return raw database objects with all fields

```tsx
// ✅ Correct: explicit select
const user = await prisma.user.update({
  where: { id: ctx.userId },
  data: parsedInput,
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// ✅ Correct: parallel queries
const [user, settings] = await Promise.all([
  prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, name: true },
  }),
  prisma.userSettings.findUnique({
    where: { userId: ctx.userId },
    select: { theme: true, language: true },
  }),
]);

// ❌ Wrong: no select
const user = await prisma.user.update({
  where: { id: ctx.userId },
  data: parsedInput,
});
```

### 11. Client-Side Usage (P0)

Use `useAction` hook from `next-safe-action/hooks`:

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createContactAction } from "@/app/actions/create-contact.action";

function ContactForm() {
  const { execute, result, isExecuting } = useAction(createContactAction);

  async function onSubmit(data: CreateContactSchemaType) {
    const result = await execute(data);

    // Check for server errors
    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }

    // Check for validation errors (handled by FormMessage automatically)
    if (result?.validationErrors) {
      return;
    }

    // Success
    if (result?.data?.success) {
      toast.success("Message envoyé avec succès !");
      form.reset();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
      <button type="submit" disabled={isExecuting}>
        {isExecuting ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
```

### 12. Error Classes Usage (P0)

Use same error classes as API Routes:

| Error Class                | Usage                                  |
| -------------------------- | -------------------------------------- |
| `BadRequestError`          | Invalid input, missing required params |
| `UnauthorizedError`        | No authentication / invalid session    |
| `ForbiddenError`           | Authenticated but not allowed          |
| `NotFoundError`            | Resource doesn't exist                 |
| `ConflictError`            | Duplicate resource, state conflict     |
| `PayloadTooLargeError`     | File/request too large                 |
| `UnprocessableEntityError` | Valid syntax but semantic error        |
| `TooManyRequestsError`     | Rate limit exceeded                    |

```tsx
import { ConflictError, NotFoundError } from "@/utils/errors/errors";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Check for conflict
    const existing = await prisma.user.findUnique({
      where: { email: parsedInput.email },
      select: { id: true },
    });

    if (existing && existing.id !== ctx.userId) {
      throw new ConflictError("Cette adresse email est déjà utilisée");
    }

    // Check for existence
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    // Update
    const updatedUser = await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    revalidatePath("/dashboard/settings");

    return { success: true, user: updatedUser };
  });
```

## Complete Examples

### Example 1: Public Action (Contact Form)

`app/actions/create-contact.action.ts`:

```tsx
"use server";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/resend";
import { actionClient } from "@/lib/safe-action";
import { CreateContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await sendEmail({
      from: `${env.NEXT_PUBLIC_APP_NAME} <${env.RESEND_EMAIL_NOREPLY}>`,
      to: env.RESEND_EMAIL_CONTACT,
      replyTo: parsedInput.email,
      subject: `[Contact] ${parsedInput.subject}`,
      react: ContactEmail({
        name: parsedInput.name,
        email: parsedInput.email,
        subject: parsedInput.subject,
        message: parsedInput.message,
      }),
    });

    return { success: true };
  });
```

### Example 2: Protected Action (Update Profile)

`app/actions/update-profile.action.ts`:

```tsx
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { authActionClient } from "@/lib/safe-action";
import { UpdateProfileSchema } from "@/lib/schemas/profile.schema";

import { ConflictError } from "@/utils/errors/errors";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Check for email conflict
    if (parsedInput.email !== ctx.userEmail) {
      const existing = await prisma.user.findUnique({
        where: { email: parsedInput.email },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictError("Cette adresse email est déjà utilisée");
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        name: parsedInput.name,
        email: parsedInput.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    revalidatePath("/dashboard/settings");

    return { success: true, user };
  });
```

### Example 3: Admin Action (Delete User)

`app/actions/delete-user.action.ts`:

```tsx
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { adminActionClient } from "@/lib/safe-action";
import { DeleteUserSchema } from "@/lib/schemas/user.schema";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

export const deleteUserAction = adminActionClient
  .inputSchema(DeleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Cannot delete yourself
    if (parsedInput.userId === ctx.userId) {
      throw new ForbiddenError(
        "Vous ne pouvez pas supprimer votre propre compte"
      );
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedInput.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundError("Utilisateur introuvable");
    }

    // Cannot delete other admins
    if (user.role === "ADMIN") {
      throw new ForbiddenError(
        "Vous ne pouvez pas supprimer un autre administrateur"
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parsedInput.userId },
    });

    revalidatePath("/admin/users");

    return { success: true };
  });
```

## Anti-Patterns

```tsx
// ❌ Wrong: Missing "use server" directive
import { authActionClient } from "@/lib/safe-action";
export const createContactAction = ...

// ❌ Wrong: "use server" not on line 1
import { authActionClient } from "@/lib/safe-action";
"use server";
export const createContactAction = ...

// ❌ Wrong: Using vanilla Server Action pattern
"use server";
async function createContactAction(formData: FormData) {
  try {
    const data = Schema.parse({ ... });
    return { success: true };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

// ❌ Wrong: Manual try/catch
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    try {
      // ❌ Not needed
      return { success: true };
    } catch (error: unknown) {
      return handleActionError(error);
    }
  });

// ❌ Wrong: No .inputSchema() validation
export const createContactAction = actionClient
  .action(async ({ parsedInput }) => {
    const data = CreateContactSchema.parse(parsedInput); // ❌ Should use .inputSchema()
    // ...
  });

// ❌ Wrong: Wrong file naming
app/actions/contact.ts           // Missing .action.ts suffix
app/actions/create-contact.ts    // Missing .action.ts suffix

// ❌ Wrong: Missing "Action" suffix
export const createContact = ...

// ❌ Wrong: Using actionClient for protected action
export const updateProfile = actionClient // ❌ Should be authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput }) => {
    // No ctx.userId available!
    // ...
  });

// ❌ Wrong: Prisma query without select
const user = await prisma.user.update({
  where: { id: ctx.userId },
  data: parsedInput,
}); // ❌ No select

// ❌ Wrong: Not using useAction hook on client
const result = await createContactAction(data); // ❌ Should use useAction
```

## Key Principles

1. **"use server" first**: MUST be the very first line
2. **File naming**: `{verb}-{entity}.action.ts` with `.action.ts` suffix
3. **Action naming**: `{verb}{Entity}Action` with "Action" suffix
4. **next-safe-action**: Use `.inputSchema()` for validation, `.action()` for logic
5. **Client selection**: `actionClient` (public), `authActionClient` (auth), `adminActionClient` (admin)
6. **No try/catch**: next-safe-action handles errors automatically
7. **Throw errors**: Use custom error classes directly
8. **Simple returns**: Return plain objects, no NextResponse
9. **Revalidate**: Call `revalidatePath()` after mutations
10. **useAction hook**: Always use `useAction` on client-side
11. **Type safety**: Automatic type inference from schema to return
12. **Prisma select**: Always specify fields explicitly
