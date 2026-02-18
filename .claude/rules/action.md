# Server Action Rules (next-safe-action)

## Context

Type-safe asynchronous functions using `next-safe-action`. Run on server, called from Client Components.

## File Location (P0)

**Path**: `features/{feature}/actions/{verb}-{entity}.action.ts`

One action per file.

## Naming (P0)

| Type     | Pattern                     | Example                    |
| -------- | --------------------------- | -------------------------- |
| Function | `{verb}{Entity}Action`      | `createContactAction`      |
| File     | `{verb}-{entity}.action.ts` | `create-contact.action.ts` |

Verbs: `create`, `update`, `delete`, `toggle`, `archive`, `send`

## Structure (P0)

```tsx
"use server"; // ← LINE 1 (MANDATORY)
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

## Action Clients (P0)

| Client              | Usage                     | Context                                      |
| ------------------- | ------------------------- | -------------------------------------------- |
| `actionClient`      | Public (no auth)          | None                                         |
| `authActionClient`  | Protected (auth required) | `userId`, `userEmail`, `userName`            |
| `adminActionClient` | Admin only                | `userId`, `userEmail`, `userName`, `isAdmin` |

**Public example**:

```tsx
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    await sendEmail({ ... });
    return { success: true };
  });
```

**Auth example**:

```tsx
export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await updateProfile({ userId: ctx.userId, data: parsedInput });
    return { success: true, user };
  });
```

**Admin example**:

```tsx
export const deleteUserAction = adminActionClient
  .inputSchema(DeleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    await prisma.user.delete({ where: { id: parsedInput.userId } });
    return { success: true };
  });
```

## Validation (P0)

`.inputSchema(Schema)` — automatic validation, no manual `parse()`.

`parsedInput` is typed and validated.

## Error Handling (P0)

- NO try/catch needed (next-safe-action handles it)
- Throw custom errors directly: `throw new ConflictError("...")`
- Errors caught by `handleServerError` in `lib/safe-action.ts`

```tsx
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
      data: { ...parsedInput, userId: ctx.userId },
      select: { id: true, email: true },
    });

    return { success: true, contact };
  });
```

## Return Values (P0)

- Plain objects (no NextResponse)
- next-safe-action wraps in `{ data: <return> }`

```tsx
return { success: true }; // Simple
return { success: true, user }; // With data
```

## Middleware (P1)

Use `.use()` for rate limiting, logging:

```tsx
export const createContactAction = actionClient
  .use(async ({ next }) => {
    await checkRatelimit(contactRatelimit, "identifier");
    return next();
  })
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => { ... });
```

## Revalidation (P1)

Call `revalidatePath()` AFTER mutation, BEFORE return:

```tsx
import { revalidatePath } from "next/cache";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.update({ ... });
    revalidatePath("/dashboard/settings");  // ← After mutation
    return { success: true, user };
  });
```

## Prisma Rules (P0)

- Always `select`
- `Promise.all` for parallel queries

```tsx
// ✅ Correct
const user = await prisma.user.update({
  where: { id: ctx.userId },
  data: parsedInput,
  select: { id: true, name: true, email: true },
});

// ❌ Wrong: no select
const user = await prisma.user.update({
  where: { id: ctx.userId },
  data: parsedInput,
});
```

## Client-Side Usage (P0)

TanStack Form + `useAction` + `getActionResult` + `getErrorMessage`:

```tsx
"use client";

import { createContactAction } from "@/features/contact/actions/create-contact.action";
import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/features/contact/schemas/contact.schema";
import { useForm } from "@tanstack/react-form";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: { name: "", email: "" } as CreateContactSchemaType,
    validators: { onSubmit: CreateContactSchema },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value)); // Throw on error
        toast.success("Message envoyé avec succès !");
        form.reset();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });
  // ...
}
```

When action returns data:

```tsx
const data = getActionResult(await executeAsync(value));
// data is typed from action return type
toast.success(data.emailChanged ? "Email mis à jour" : "Profil mis à jour");
```

## Anti-Patterns

```tsx
// ❌ Wrong: Missing "use server"
import { actionClient } from "@/lib/safe-action";
export const createContactAction = ...

// ❌ Wrong: "use server" not on line 1
import { actionClient } from "@/lib/safe-action";
"use server";

// ❌ Wrong: File location
lib/actions/create-contact.action.ts  // → features/contact/actions/

// ❌ Wrong: Missing "Action" suffix
export const createContact = ...

// ❌ Wrong: Manual try/catch
export const createContactAction = actionClient
  .inputSchema(CreateContactSchema)
  .action(async ({ parsedInput }) => {
    try {  // ❌ Not needed
      return { success: true };
    } catch (error: unknown) {
      return handleActionError(error);
    }
  });

// ❌ Wrong: Manual parse
export const createContactAction = actionClient
  .action(async ({ parsedInput }) => {
    const data = CreateContactSchema.parse(parsedInput); // ❌ Should use .inputSchema()
  });

// ❌ Wrong: Prisma without select
const user = await prisma.user.update({ where: { id }, data });

// ❌ Wrong: Client-side manual if/else
const result = await executeAsync(value);
if (result?.serverError) {
  toast.error(result.serverError);
  return;
}
// ✅ Use: getActionResult(await executeAsync(value)) in try/catch
```
