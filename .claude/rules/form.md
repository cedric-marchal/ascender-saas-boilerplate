# Form Creation Rules

## Context

These rules apply exclusively to creating forms using TanStack Form (`@tanstack/react-form`), Zod validation, and the custom `Field` UI components from `@/components/ui/field`. Forms submit via Server Actions (`next-safe-action`) or API Routes (`fetch` with `FormData`).

## Rules

### 1. File Location & Naming (P0)

- Form components MUST use the `-form.tsx` suffix
- Form components MUST be in `_components/forms/` folder
- One form per file
- Forms MUST always be separate from modals (even for simple forms)

```bash
# ✅ Correct: Form and Modal separated
app/(protected)/dashboard/settings/_components/forms/delete-account-form.tsx
app/(protected)/dashboard/settings/_components/modals/delete-account-modal.tsx

# ✅ Correct: Standalone form
app/(public)/contact/_components/forms/contact-form.tsx

# ❌ Wrong: Form inline in modal
app/(protected)/dashboard/settings/_components/modals/delete-account-modal.tsx  # Contains form logic

# ❌ Wrong: Form not in forms/ subfolder
app/(public)/contact/_components/contact-form.tsx

# ❌ Wrong: Generic name
app/(public)/contact/_components/forms/form.tsx

# ❌ Wrong: Multiple forms in one file
app/(protected)/dashboard/settings/_components/forms/settings-forms.tsx
```

### 2. Imports Structure (P0)

- ALWAYS use `import type` for type-only imports
- Import order: React types → React → Next.js → external libs → internal libs → components → actions → utils

```tsx
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/lib/schemas/contact.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createContactAction } from "@/app/(public)/contact/_actions/create-contact.action";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";
```

### 3. Form Hook Setup (P0)

- ALWAYS use `useForm` from `@tanstack/react-form`
- ALWAYS define `defaultValues` with `as SchemaType` assertion
- ALWAYS use `validators.onSubmit` with imported Zod schema
- ALWAYS define `onSubmit` inline with `async ({ value })` pattern
- NEVER use inline schema definition
- NEVER use `zodResolver` (that's react-hook-form)

```tsx
// ✅ Correct: TanStack Form with Zod validator
const form = useForm({
  defaultValues: {
    name: "",
    email: "",
    message: "",
  } as CreateContactSchemaType,
  validators: {
    onSubmit: CreateContactSchema,
  },
  onSubmit: async ({ value }) => {
    // submission logic
  },
});

// ❌ Wrong: react-hook-form pattern
const form = useForm<CreateContactSchemaType>({
  resolver: zodResolver(CreateContactSchema),
  defaultValues: { name: "" },
});

// ❌ Wrong: Missing defaultValues
const form = useForm({
  validators: { onSubmit: CreateContactSchema },
  onSubmit: async ({ value }) => { ... },
});

// ❌ Wrong: Inline schema
const form = useForm({
  defaultValues: { name: "" },
  validators: { onSubmit: z.object({ name: z.string() }) },
  onSubmit: async ({ value }) => { ... },
});
```

### 4. Two Submission Patterns (P0)

#### Pattern A: Server Actions (preferred)

Use `useAction` from `next-safe-action/hooks` with `getActionResult` from `@/utils/errors/get-action-result` for type-safe result extraction, and `getErrorMessage` from `@/utils/errors/get-error-message` for centralized error handling. This follows the binary pattern: either success or throw.

```tsx
import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      message: "",
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

  // ...
}
```

When the action returns data you need:

```tsx
onSubmit: async ({ value }) => {
  try {
    const data = getActionResult(await executeAsync(value));

    toast.success(
      data.emailChanged
        ? "Profil mis à jour. Un email de vérification a été envoyé."
        : "Profil mis à jour avec succès"
    );

    router.refresh();
  } catch (error: unknown) {
    toast.error(getErrorMessage(error));
  }
},
```

#### Pattern B: API Routes (for file uploads)

Use `upfetch` from `@/lib/up-fetch` with `FormData`. upfetch auto-parses JSON and throws `ResponseError` on non-ok responses. Use `getErrorMessage` from `@/utils/errors/get-error-message` for centralized error extraction.

```tsx
import { upfetch } from "@/lib/up-fetch";

import { getErrorMessage } from "@/utils/errors/get-error-message";

function AvatarForm({ user }: AvatarFormProps) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      avatar: undefined as File | undefined,
    },
    validators: {
      onSubmit: UpdateAvatarSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.avatar) {
        return;
      }

      const formData = new FormData();
      formData.append("avatar", value.avatar);

      try {
        await upfetch("/api/avatar", {
          method: "POST",
          body: formData,
        });

        toast.success("Avatar mis à jour avec succès");

        form.reset();
        router.refresh();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  // ...
}
```

### 5. Form Submit Handler (P0)

- ALWAYS use native `<form>` element with typed `onSubmit`
- ALWAYS type the event as `SubmitEvent<HTMLFormElement>`
- ALWAYS call `event.preventDefault()` then `form.handleSubmit()`

```tsx
// ✅ Correct
<form
  onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit();
  }}
  className="space-y-6"
>
  {/* fields */}
</form>

// ❌ Wrong: react-hook-form pattern
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* fields */}
  </form>
</Form>

// ❌ Wrong: Untyped event
<form onSubmit={(event) => { ... }}>
```

### 6. Field Pattern (P0)

- ALWAYS use `<form.Field>` with `name` and `children` props
- ALWAYS compute `isInvalid` from `field.state.meta.isTouched && !field.state.meta.isValid`
- ALWAYS use `<Field>` wrapper with `data-invalid={isInvalid}`
- ALWAYS use `<FieldLabel>` with explicit `htmlFor` matching a unique `id`
- ALWAYS show errors conditionally with `<FieldError errors={field.state.meta.errors} />`
- ALWAYS set `aria-invalid={isInvalid}` on the input element
- ALWAYS type `handleChange` with proper event type
- Use `<FieldDescription>` when helpful

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

### 7. Submit Button with form.Subscribe (P0)

- ALWAYS use `<form.Subscribe>` to access `canSubmit` and `isSubmitting`
- ALWAYS disable button when `!canSubmit || isExecuting || isSubmitting`
- ALWAYS show loading indicator with `Loader2`
- For Server Action forms, combine `isExecuting` (from `useAction`) and `isSubmitting` (from form)

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

For API Route forms (no `isExecuting`):

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <Button type="submit" disabled={!canSubmit || isSubmitting}>
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {isSubmitting ? "Envoi en cours..." : "Envoyer"}
    </Button>
  )}
</form.Subscribe>
```

### 8. Field Types Reference (P0)

#### Text Input

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
        <FieldLabel htmlFor="form-name">Nom</FieldLabel>
        <Input
          id="form-name"
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
```

#### Email Input

```tsx
<form.Field
  name="email"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      field.handleChange(event.target.value);
    }

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-email">Email</FieldLabel>
        <Input
          id="form-email"
          type="email"
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={handleChange}
          aria-invalid={isInvalid}
          placeholder="votre@email.com"
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

#### Password Input

```tsx
<form.Field
  name="password"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      field.handleChange(event.target.value);
    }

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-password">Mot de passe</FieldLabel>
        <Input
          id="form-password"
          type="password"
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={handleChange}
          aria-invalid={isInvalid}
          placeholder="••••••••"
        />
        <FieldDescription>Minimum 8 caractères</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

#### Textarea

```tsx
<form.Field
  name="message"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
      field.handleChange(event.target.value);
    }

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-message">Message</FieldLabel>
        <Textarea
          id="form-message"
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={handleChange}
          aria-invalid={isInvalid}
          placeholder="Votre message..."
          className="min-h-32 resize-none"
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

#### Select

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
            <SelectValue placeholder="Sélectionnez un rôle" />
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

#### Checkbox

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
        <FieldLabel htmlFor="form-terms">
          J'accepte les conditions d'utilisation
        </FieldLabel>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

#### Switch

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

### 9. File Upload with Drag & Drop (P0)

- File inputs MUST always include drag & drop functionality
- MUST show file preview after selection
- MUST allow file removal
- MUST show file size and type validation feedback
- Use `field.handleChange(file)` instead of `onChange`

```tsx
<form.Field
  name="avatar"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
      event.preventDefault();
      setIsDragging(true);
    }

    function handleDragLeave(event: DragEvent<HTMLDivElement>) {
      event.preventDefault();
      setIsDragging(false);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
      event.preventDefault();
      setIsDragging(false);

      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile) {
        field.handleChange(droppedFile);
      }
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        field.handleChange(selectedFile);
      }
    }

    function handleRemoveFile() {
      field.handleChange(undefined);
    }

    const value = field.state.value;

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-avatar">Document</FieldLabel>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            value && "border-primary/50 bg-primary/5 border-solid"
          )}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{value.name}</span>
              <span className="text-muted-foreground text-xs">
                ({(value.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Supprimer le fichier</span>
              </Button>
            </div>
          ) : (
            <>
              <Upload
                className="text-muted-foreground mb-2 h-8 w-8"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                Glissez-déposez un fichier ou{" "}
                <label className="text-primary cursor-pointer font-medium hover:underline">
                  parcourir
                  <input
                    id="form-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
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

### 10. Props Interface (P0)

- Use `{FormName}Props` type if form receives props
- For edit forms, pass initial data as props

```tsx
type ProfileFormProps = {
  name: string;
  email: string;
  emailVerified: boolean;
};

function ProfileForm({ name, email, emailVerified }: ProfileFormProps) {
  const { executeAsync, isExecuting } = useAction(updateProfileAction);

  const form = useForm({
    defaultValues: {
      name: name,
      email: email,
    } as UpdateProfileSchemaType,
    validators: {
      onSubmit: UpdateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await executeAsync(value);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data) {
        toast.success("Profil mis à jour avec succès");
        router.refresh();
      }
    },
  });

  // ...
}

export { ProfileForm };
```

### 11. Form in Modal Pattern (P0)

- Form and Modal MUST always be separate files
- Modal imports and renders the Form

#### Form File

`app/(protected)/admin/parametres/_components/forms/admin-delete-account-form.tsx`:

```tsx
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/lib/schemas/account.schema";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { deleteAccountAction } from "@/app/(protected)/_actions/delete-account.action";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

type AdminDeleteAccountFormProps = {
  email: string;
  onSuccess: () => void;
};

function AdminDeleteAccountForm({
  email,
  onSuccess,
}: AdminDeleteAccountFormProps) {
  const { executeAsync, isExecuting } = useAction(deleteAccountAction);

  const form = useForm({
    defaultValues: {
      confirmation: "",
    } as DeleteAccountSchemaType,
    validators: {
      onSubmit: DeleteAccountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        getActionResult(await executeAsync(value));

        toast.success("Votre compte a été supprimé avec succès");
        await signOut().catch(() => {});

        onSuccess();
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
      className="space-y-4"
    >
      <form.Field
        name="confirmation"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="admin-delete-confirmation">
                Confirmation
              </FieldLabel>
              <Input
                id="admin-delete-confirmation"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder={email}
              />
              <FieldDescription>
                Tapez votre adresse email pour confirmer la suppression
              </FieldDescription>
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
            variant="destructive"
            disabled={!canSubmit || isExecuting || isSubmitting}
            className="w-full"
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting
              ? "Suppression..."
              : "Supprimer mon compte"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { AdminDeleteAccountForm };
```

#### Modal File

`app/(protected)/admin/parametres/_components/modals/admin-delete-account-modal.tsx`:

```tsx
"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AdminDeleteAccountForm } from "@/app/(protected)/admin/parametres/_components/forms/admin-delete-account-form";

type AdminDeleteAccountModalProps = {
  email: string;
};

function AdminDeleteAccountModal({ email }: AdminDeleteAccountModalProps) {
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
          <DialogDescription>
            Cette action est irréversible. Toutes vos données seront supprimées.
          </DialogDescription>
        </DialogHeader>
        <AdminDeleteAccountForm email={email} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

export { AdminDeleteAccountModal };
```

## Complete Example

### Contact Form with Server Action

`app/(public)/contact/_components/forms/contact-form.tsx`:

```tsx
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/lib/schemas/contact.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createContactAction } from "@/app/(public)/contact/_actions/create-contact.action";

import { getActionResult } from "@/utils/errors/get-action-result";
import { getErrorMessage } from "@/utils/errors/get-error-message";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
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
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
                  placeholder="Jean Dupont"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="email"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            function handleChange(event: ChangeEvent<HTMLInputElement>) {
              field.handleChange(event.target.value);
            }

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <Input
                  id="contact-email"
                  type="email"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={handleChange}
                  aria-invalid={isInvalid}
                  placeholder="jean@exemple.fr"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </div>

      <form.Field
        name="subject"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLInputElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="contact-subject">Sujet</FieldLabel>
              <Input
                id="contact-subject"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Comment pouvons-nous vous aider ?"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Field
        name="message"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
            field.handleChange(event.target.value);
          }

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="contact-message">Message</FieldLabel>
              <Textarea
                id="contact-message"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={handleChange}
                aria-invalid={isInvalid}
                placeholder="Décrivez votre demande..."
                className="min-h-32 resize-none"
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
            className="w-full"
            disabled={!canSubmit || isExecuting || isSubmitting}
          >
            {isExecuting || isSubmitting ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isExecuting || isSubmitting
              ? "Envoi en cours..."
              : "Envoyer le message"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { ContactForm };
```

## UI Components Reference

### Field Components (`@/components/ui/field`)

| Component          | Usage                                        |
| ------------------ | -------------------------------------------- |
| `Field`            | Wrapper with `data-invalid` support          |
| `FieldLabel`       | Label with `htmlFor` attribute               |
| `FieldDescription` | Helper text below input                      |
| `FieldError`       | Error display from `field.state.meta.errors` |
| `FieldSet`         | Groups multiple fields                       |
| `FieldGroup`       | Container for field groups                   |
| `FieldLegend`      | Legend for fieldsets                         |
| `FieldSeparator`   | Visual separator between fields              |

### TanStack Form API Reference

| API                          | Usage                                      |
| ---------------------------- | ------------------------------------------ |
| `useForm()`                  | Create form instance                       |
| `form.Field`                 | Render a field with state management       |
| `form.Subscribe`             | Subscribe to form state changes            |
| `form.handleSubmit()`        | Trigger form submission                    |
| `form.reset()`               | Reset form to defaultValues                |
| `form.getFieldValue(name)`   | Get current field value                    |
| `field.handleChange(value)`  | Update field value                         |
| `field.handleBlur`           | Handle blur event                          |
| `field.state.value`          | Current field value                        |
| `field.state.meta.isTouched` | Whether field has been touched             |
| `field.state.meta.isValid`   | Whether field passes validation            |
| `field.state.meta.errors`    | Array of validation errors                 |
| `field.name`                 | Field name (for `name` attribute on input) |

## Anti-Patterns

```tsx
// ❌ Wrong: Using react-hook-form
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// ❌ Wrong: Using Shadcn/ui Form components (react-hook-form based)
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// ❌ Wrong: react-hook-form setup
const form = useForm<SchemaType>({
  resolver: zodResolver(Schema),
  defaultValues: { ... },
});

// ❌ Wrong: react-hook-form submit pattern
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>

// ❌ Wrong: react-hook-form field pattern
<FormField control={form.control} name="x" render={({ field }) => (
  <FormItem><FormControl><Input {...field} /></FormControl></FormItem>
)} />

// ❌ Wrong: Form logic inside modal file
function DeleteAccountModal() {
  const form = useForm({ ... });
  return <Dialog><form>...</form></Dialog>;
}

// ❌ Wrong: Inline schema definition
const form = useForm({
  validators: { onSubmit: z.object({ name: z.string() }) },
});

// ❌ Wrong: Missing defaultValues
const form = useForm({
  validators: { onSubmit: Schema },
  onSubmit: async ({ value }) => { ... },
});

// ❌ Wrong: File input without drag & drop
<input type="file" onChange={handleChange} />

// ❌ Wrong: Missing isInvalid pattern
<form.Field name="x" children={(field) => (
  <Field>
    <Input value={field.state.value} />
  </Field>
)} />

// ❌ Wrong: Missing aria-invalid on input
<Input
  value={field.state.value}
  onChange={handleChange}
/>

// ❌ Wrong: Using native fetch instead of upfetch
const response = await fetch("/api/endpoint", { ... });
const body = await response.json();
// Use: const result = await upfetch("/api/endpoint", { ... });

// ❌ Wrong: Manual if/else for server action results
const result = await executeAsync(value);
if (result?.serverError) {
  toast.error(result.serverError);
  return;
}
if (result?.data?.success) {
  toast.success("Succès !");
}
// Use: getActionResult(await executeAsync(value)) in try/catch

// ❌ Wrong: Abbreviated variable names
function handleDrop(e: DragEvent) { ... }
const res = await upfetch(...);

// ❌ Wrong: Missing type in callback
{options.map((option) => ...)}

// ❌ Wrong: Missing aria-hidden on decorative icons
<Loader2 className="animate-spin" />

// ❌ Wrong: Default export
export default function ContactForm() { ... }

// ❌ Wrong: useState for loading with Server Actions
const [isLoading, setIsLoading] = useState(false);
// Use form.Subscribe + isExecuting from useAction instead
```

## Key Principles

1. **TanStack Form**: Always use `@tanstack/react-form` with `useForm`, never react-hook-form
2. **Field UI**: Use `Field`, `FieldLabel`, `FieldError`, `FieldDescription` from `@/components/ui/field`
3. **Zod validators**: Use `validators: { onSubmit: Schema }`, never `zodResolver`
4. **Separation**: Form and Modal always in separate files, forms in `_components/forms/`
5. **Schema import**: Always import Zod schema from `@/lib/schemas/`
6. **Server Actions preferred**: Use `useAction` + `executeAsync` + `getActionResult` + `getErrorMessage` in try/catch
7. **API Routes for files**: Use `upfetch` from `@/lib/up-fetch` with `getErrorMessage` in try/catch (never native `fetch`)
8. **Unified error handling**: Both patterns use `try/catch` + `getErrorMessage` for consistent error display
9. **isInvalid pattern**: Always compute `field.state.meta.isTouched && !field.state.meta.isValid`
10. **form.Subscribe**: Always use for submit button state (`canSubmit`, `isSubmitting`)
11. **Drag & Drop**: File inputs must always include drag & drop
12. **Accessibility**: `aria-invalid` on inputs, `aria-hidden` on icons, `sr-only` for screen readers
13. **Reset on success**: Call `form.reset()` after successful submission
14. **Explicit naming**: Full variable names, typed callbacks, typed events
