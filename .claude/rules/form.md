# Form Rules

## Context

Forms using TanStack Form + Zod + `next-safe-action`. Submit via Server Actions (preferred) or API Routes (files).

## File Location (P0)

- MUST be in `features/{feature}/components/forms/{entity}-form.tsx`
- Forms MUST always be separate from modals (even simple forms)
- One form per file

```bash
# ✅ Correct
features/contact/components/forms/contact-form.tsx
features/account/components/forms/profile-form.tsx
features/account/components/modals/delete-account-modal.tsx  # Separate from form

# ❌ Wrong
features/contact/components/contact-form.tsx  # Not in forms/ subfolder
features/account/components/modals/delete-account-modal.tsx  # Contains form logic inline
```

## Imports Structure (P0)

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

**Rules**: `import type` for types only, inline `type` for mixed imports, order: React → libs → schemas → components → actions → utils

## Form Hook Setup (P0)

```tsx
const form = useForm({
  defaultValues: { name: "", email: "" } as CreateContactSchemaType,
  validators: { onSubmit: CreateContactSchema },
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

**Rules**:

- ALWAYS `defaultValues` with `as SchemaType` assertion
- ALWAYS `validators: { onSubmit: Schema }` (never `zodResolver`)
- NEVER inline schema definition
- NEVER use react-hook-form

## Two Submission Patterns (P0)

### Pattern A: Server Actions (Preferred)

```tsx
const { executeAsync, isExecuting } = useAction(createContactAction);

const form = useForm({
  defaultValues: { ... } as SchemaType,
  validators: { onSubmit: Schema },
  onSubmit: async ({ value }) => {
    try {
      getActionResult(await executeAsync(value));  // Throws on error
      toast.success("Succès !");
      form.reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  },
});
```

When action returns data:

```tsx
const data = getActionResult(await executeAsync(value));
toast.success(data.emailChanged ? "Email mis à jour" : "Profil mis à jour");
```

### Pattern B: API Routes (File Uploads)

```tsx
import { upfetch } from "@/lib/up-fetch";

import { getErrorMessage } from "@/utils/errors/get-error-message";

const form = useForm({
  defaultValues: { avatar: undefined as File | undefined },
  validators: { onSubmit: UpdateAvatarSchema },
  onSubmit: async ({ value }) => {
    if (!value.avatar) return;

    const formData = new FormData();
    formData.append("avatar", value.avatar);

    try {
      await upfetch("/api/avatar", { method: "POST", body: formData });
      toast.success("Avatar mis à jour");
      form.reset();
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  },
});
```

## Form Submit Handler (P0)

```tsx
<form
  onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit();
  }}
  className="space-y-6"
>
  {/* fields */}
</form>
```

**Rules**: ALWAYS type event as `SubmitEvent<HTMLFormElement>`, ALWAYS `preventDefault()` then `form.handleSubmit()`

## Field Pattern (P0)

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

**Rules**:

- ALWAYS compute `isInvalid` from `isTouched && !isValid`
- ALWAYS `<Field data-invalid={isInvalid}>`
- ALWAYS `<FieldLabel htmlFor>` with unique `id`
- ALWAYS `aria-invalid={isInvalid}` on input
- ALWAYS type `handleChange` with proper event type
- ALWAYS conditionally show `<FieldError>`

## Submit Button with form.Subscribe (P0)

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

**Rules**: Server Actions: combine `isExecuting` + `isSubmitting`. API Routes: only `isSubmitting`.

## Field Types Reference (P0)

| Field Type  | Event Type                         | handleChange                                        |
| ----------- | ---------------------------------- | --------------------------------------------------- |
| Text Input  | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(event.target.value)`            |
| Email Input | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(event.target.value)`            |
| Password    | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(event.target.value)`            |
| Textarea    | `ChangeEvent<HTMLTextAreaElement>` | `field.handleChange(event.target.value)`            |
| Select      | N/A                                | `field.handleChange(value)` via `onValueChange`     |
| Checkbox    | N/A                                | `field.handleChange(checked)` via `onCheckedChange` |
| Switch      | N/A                                | `field.handleChange(checked)` via `onCheckedChange` |
| File        | `ChangeEvent<HTMLInputElement>`    | `field.handleChange(file)`                          |

### Select Example

```tsx
<form.Field
  name="role"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-role">Rôle</FieldLabel>
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
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

### Checkbox Example

```tsx
<form.Field
  name="acceptTerms"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    return (
      <Field data-invalid={isInvalid} orientation="horizontal">
        <Checkbox
          id="form-terms"
          checked={field.state.value}
          onCheckedChange={(checked: boolean) => field.handleChange(checked)}
        />
        <FieldLabel htmlFor="form-terms">J'accepte les conditions</FieldLabel>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

### Switch Example

```tsx
<form.Field
  name="notifications"
  children={(field) => (
    <Field
      orientation="horizontal"
      className="justify-between rounded-lg border p-4"
    >
      <div className="space-y-0.5">
        <FieldLabel htmlFor="form-notifications">Notifications</FieldLabel>
        <FieldDescription>
          Recevoir des notifications par email.
        </FieldDescription>
      </div>
      <Switch
        id="form-notifications"
        checked={field.state.value}
        onCheckedChange={(checked: boolean) => field.handleChange(checked)}
      />
    </Field>
  )}
/>
```

## File Upload with Drag & Drop (P0)

File inputs MUST include drag & drop + preview + removal.

```tsx
<form.Field
  name="avatar"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    const [isDragging, setIsDragging] = useState(false);

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
      event.preventDefault();
      setIsDragging(true);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
      event.preventDefault();
      setIsDragging(false);
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile) field.handleChange(droppedFile);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) field.handleChange(selectedFile);
    }

    const value = field.state.value;

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-avatar">Document</FieldLabel>
        <div
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed p-6",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            value && "border-primary/50",
          )}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{value.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => field.handleChange(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                Glissez-déposez un fichier ou{" "}
                <label className="text-primary cursor-pointer font-medium">
                  parcourir
                  <input
                    id="form-avatar"
                    type="file"
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                </label>
              </p>
            </>
          )}
        </div>
        <FieldDescription>JPG, PNG ou WebP, 5 MB maximum</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

## Form in Modal Pattern (P0)

Form and Modal MUST be separate files.

### Form File

`features/account/components/forms/delete-account-form.tsx`

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAccountAction } from "@/features/account/actions/delete-account.action";
import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/features/account/schemas/account.schema";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type DeleteAccountFormProps = {
  email: string;
  onSuccess: () => void;
};

function DeleteAccountForm({ email, onSuccess }: DeleteAccountFormProps) {
  const { executeAsync, isExecuting } = useAction(deleteAccountAction);

  const form = useForm({
    defaultValues: { confirmation: "" } as DeleteAccountSchemaType,
    validators: { onSubmit: DeleteAccountSchema },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));
        toast.success("Compte supprimé");
        onSuccess();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  return <form>{/* fields */}</form>;
}

export { DeleteAccountForm };
```

### Modal File

`features/account/components/modals/delete-account-modal.tsx`

```tsx
"use client";

import { useState } from "react";

import { DeleteAccountForm } from "@/features/account/components/forms/delete-account-form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteAccountModalProps = { email: string };

function DeleteAccountModal({ email }: DeleteAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Supprimer mon compte</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer votre compte</DialogTitle>
        </DialogHeader>
        <DeleteAccountForm email={email} onSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccountModal };
```

## UI Components Reference

| Component          | Usage                                        |
| ------------------ | -------------------------------------------- |
| `Field`            | Wrapper with `data-invalid` support          |
| `FieldLabel`       | Label with `htmlFor`                         |
| `FieldDescription` | Helper text                                  |
| `FieldError`       | Error display from `field.state.meta.errors` |

## TanStack Form API

| API                          | Usage                   |
| ---------------------------- | ----------------------- |
| `useForm()`                  | Create form instance    |
| `form.Field`                 | Render field with state |
| `form.Subscribe`             | Subscribe to form state |
| `form.handleSubmit()`        | Trigger submission      |
| `form.reset()`               | Reset to defaultValues  |
| `field.handleChange(value)`  | Update field value      |
| `field.handleBlur`           | Handle blur event       |
| `field.state.value`          | Current field value     |
| `field.state.meta.isTouched` | Field touched           |
| `field.state.meta.isValid`   | Field valid             |
| `field.state.meta.errors`    | Validation errors       |

## Anti-Patterns

```tsx
// ❌ react-hook-form
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
const form = useForm({ resolver: zodResolver(Schema) });

// ❌ Shadcn/ui Form components (react-hook-form based)
import { Form, FormField } from "@/components/ui/form";

// ❌ Form logic inside modal
function DeleteModal() {
  const form = useForm({ ... });
  return <Dialog><form>...</form></Dialog>;
}

// ❌ Inline schema
const form = useForm({ validators: { onSubmit: z.object({ name: z.string() }) } });

// ❌ Missing defaultValues
const form = useForm({ validators: { onSubmit: Schema }, onSubmit: async ({ value }) => { ... } });

// ❌ File input without drag & drop
<input type="file" onChange={handleChange} />

// ❌ Missing isInvalid pattern
<form.Field name="x" children={(field) => <Field><Input value={field.state.value} /></Field>} />

// ❌ Missing aria-invalid
<Input value={field.state.value} onChange={handleChange} />

// ❌ Using native fetch instead of upfetch
const response = await fetch("/api/endpoint", { ... });

// ❌ Manual if/else for server action results
const result = await executeAsync(value);
if (result?.serverError) { toast.error(result.serverError); return; }

// ❌ Missing type in callback
{options.map((option) => ...)}

// ❌ Missing aria-hidden on decorative icons
<Loader2 className="animate-spin" />

// ❌ Default export
export default function ContactForm() { ... }

// ❌ useState for loading with Server Actions (use form.Subscribe + isExecuting)
const [isLoading, setIsLoading] = useState(false);
```

## Key Principles

1. **TanStack Form**: Always `@tanstack/react-form` with `useForm`, never react-hook-form
2. **Field UI**: Use `Field`, `FieldLabel`, `FieldError`, `FieldDescription` from `@/components/ui/field`
3. **Zod validators**: Use `validators: { onSubmit: Schema }`, never `zodResolver`
4. **Separation**: Form and Modal always separate files, forms in `features/{feature}/components/forms/`
5. **Schema import**: Always import from `@/features/{feature}/schemas/`
6. **Server Actions preferred**: Use `useAction` + `executeAsync` + `getActionResult` + `getErrorMessage` in try/catch
7. **API Routes for files**: Use `upfetch` with `getErrorMessage` in try/catch (never native `fetch`)
8. **Unified error handling**: Both patterns use `try/catch` + `getErrorMessage`
9. **isInvalid pattern**: Always compute `isTouched && !isValid`
10. **form.Subscribe**: Always use for submit button state
11. **Drag & Drop**: File inputs must include drag & drop
12. **Accessibility**: `aria-invalid`, `aria-hidden`, `sr-only`
13. **Reset on success**: Call `form.reset()` after success
14. **Explicit naming**: Full variable names, typed callbacks, typed events
