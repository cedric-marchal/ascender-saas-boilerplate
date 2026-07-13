---
paths:
  - "src/features/*/components/forms/**"
  - "src/components/ui/field*"
---

# Form Rules

## File Location

MUST be in `src/features/{feature}/components/forms/{entity}-form.tsx`

Forms MUST always be separate from modals. One form per file.

## Imports Structure

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
```

## Form Hook Setup

```tsx
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
```

Rules:

- ALWAYS `defaultValues` with `as SchemaType` assertion
- ALWAYS `validators: { onSubmit: Schema }` (NEVER `zodResolver`)
- NEVER inline schema definition — import from `src/features/*/schemas/`
- NEVER react-hook-form

## Two Submission Patterns

### Pattern A: Server Actions (Preferred)

`useAction` + `executeAsync` + `getActionResult` + `getErrorMessage` in try/catch.

When action returns data:

```tsx
const data = getActionResult(await executeAsync(value));
toast.success(data.emailChanged ? "Email mis à jour" : "Profil mis à jour");
```

### Pattern B: API Routes (File Uploads)

`upfetch` + `FormData` + `getErrorMessage` in try/catch. Add `router.refresh()` after success.

```tsx
import { upfetch } from "@/lib/up-fetch";

const formData = new FormData();
formData.append("avatar", value.avatar);

try {
  await upfetch("/api/avatar", {
    method: "POST",
    body: formData,
  });

  toast.success("Avatar mis à jour");

  form.reset();
  router.refresh();
} catch (error: unknown) {
  toast.error(getErrorMessage(error));
}
```

## Form Submit Handler

```tsx
<form
  onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit();
  }}
  className="space-y-6"
>
```

ALWAYS type event as `SubmitEvent<HTMLFormElement>`.

## Field Pattern

```tsx
<form.Field
  name="name"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

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
          placeholder="Jean Dupont"
        />

        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

Rules:

- ALWAYS compute `isInvalid` from `isTouched && !isValid`
- ALWAYS `<Field data-invalid={isInvalid}>`
- ALWAYS `<FieldLabel htmlFor>` with unique `id`
- ALWAYS `aria-invalid={isInvalid}` on input
- ALWAYS type `handleChange` with proper event type
- ALWAYS conditionally show `<FieldError>`

## Submit Button

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <Button type="submit" disabled={!canSubmit || isExecuting || isSubmitting}>
      {isExecuting || isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}

      {isExecuting || isSubmitting ? "Envoi en cours..." : "Envoyer"}
    </Button>
  )}
</form.Subscribe>
```

Server Actions: combine `isExecuting` + `isSubmitting`. API Routes: only `isSubmitting`.

## Field Types Reference

| Field Type | Event Type                         | handleChange                                        |
| ---------- | ---------------------------------- | --------------------------------------------------- |
| Text/Email | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(event.target.value)`            |
| Textarea   | `ChangeEvent<HTMLTextAreaElement>` | `field.handleChange(event.target.value)`            |
| Select     | N/A                                | `field.handleChange(value)` via `onValueChange`     |
| Checkbox   | N/A                                | `field.handleChange(checked)` via `onCheckedChange` |
| Switch     | N/A                                | `field.handleChange(checked)` via `onCheckedChange` |
| File       | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(file)`                          |

### Select Field

```tsx
<Select
  value={field.state.value}
  onValueChange={(value: string) => field.handleChange(value)}
>
  <SelectTrigger id="form-role">
    <SelectValue placeholder="Sélectionnez" />
  </SelectTrigger>

  <SelectContent>
    {roles.map((role: Role) => (
      <SelectItem key={role.value} value={role.value}>
        {role.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Checkbox Field

```tsx
<Checkbox
  id="form-terms"
  checked={field.state.value}
  onCheckedChange={(checked: boolean) => field.handleChange(checked)}
/>
```

## File Upload

File inputs MUST include drag & drop + preview + removal.

See existing implementation pattern in `src/features/account/components/forms/` for the full drag & drop template with `handleDragOver`, `handleDrop`, `handleInputChange`.

Core requirements:

- `DragEvent<HTMLDivElement>` for drag handlers
- `ChangeEvent<HTMLInputElement>` for file input
- Visual feedback with `isDragging` state
- Preview with file name + remove button
- `<FieldDescription>` with accepted types and size limit

## Social Sign-In (Google OAuth)

ALWAYS pass `callbackURL: "/connexion"` to `signIn.social()`. After OAuth, the user lands on `/connexion` where `requireGuest()` handles role-based redirect via `ROLE_DASHBOARD_URL`.

```tsx
async function handleGoogleSignIn() {
  const { error } = await signIn.social({
    provider: "google",
    callbackURL: "/connexion",
  });

  if (error) {
    toast.error(error.message || "Une erreur est survenue");
  }
}
```

## Form in Modal

Form and Modal MUST be separate files. See `feature.md` for modal rules.

- Form receives `onSuccess: () => void` callback
- Modal manages `isOpen` / `setIsOpen` state
- Modal passes `onSuccess={() => setIsOpen(false)}` to Form

## UI Components

| Component          | Import from             | Usage                       |
| ------------------ | ----------------------- | --------------------------- |
| `Field`            | `@/components/ui/field` | Wrapper with `data-invalid` |
| `FieldLabel`       | `@/components/ui/field` | Label with `htmlFor`        |
| `FieldDescription` | `@/components/ui/field` | Helper text                 |
| `FieldError`       | `@/components/ui/field` | Error display               |

## Anti-Patterns

```
react-hook-form or zodResolver
Shadcn/ui Form components (react-hook-form based)
Form logic inside modal file
Inline schema definition
Missing defaultValues
File input without drag & drop
Missing isInvalid pattern or aria-invalid
Native fetch instead of upfetch
Manual if/else for action results (use getActionResult in try/catch)
Untyped callbacks in map/filter
Missing aria-hidden on decorative icons
Default export
useState for loading with Server Actions (use form.Subscribe + isExecuting)
Hardcoded redirect after sign-in (use data.redirectUrl from action)
Missing callbackURL on signIn.social() (must be "/connexion" for role-based redirect)
```
