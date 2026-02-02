# Form Creation Rules

## Context

These rules apply exclusively to creating forms using react-hook-form, Zod validation, and Shadcn/ui Form components. Forms submit to API Routes via fetch with FormData.

## Rules

### 1. File Location & Naming (P0)

- Form components MUST use the `-form.tsx` suffix
- Form components MUST be in `_components/` folder
- One form per file
- Forms MUST always be separate from modals (even for simple forms)

```bash
# ✅ Correct: Form and Modal separated
app/(protected)/dashboard/settings/_components/delete-account-form.tsx
app/(protected)/dashboard/settings/_components/delete-account-modal.tsx

# ✅ Correct: Standalone form
app/(public)/contact/_components/contact-form.tsx

# ❌ Wrong: Form inline in modal
app/(protected)/dashboard/settings/_components/delete-account-modal.tsx  # Contains form logic

# ❌ Wrong: Generic name
app/(public)/contact/_components/form.tsx

# ❌ Wrong: Multiple forms in one file
app/(protected)/dashboard/settings/_components/settings-forms.tsx
```

### 2. Imports Structure (P0)

- ALWAYS use `import type` for type-only imports
- Import order: React types → React → external libs → internal libs → components → schemas

```tsx
"use client";

import { type ChangeEvent, type DragEvent, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/lib/schemas/contact.schema";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
```

### 3. Form Hook Setup (P0)

- ALWAYS use `zodResolver` with imported Zod schema
- ALWAYS type form with `SchemaType`
- ALWAYS define `defaultValues`
- NEVER use inline schema definition

```tsx
// ✅ Correct
const form = useForm<CreateContactSchemaType>({
  resolver: zodResolver(CreateContactSchema),
  defaultValues: {
    name: "",
    email: "",
    message: "",
  },
});

// ❌ Wrong: Inline schema
const form = useForm({
  resolver: zodResolver(z.object({ name: z.string() })),
});

// ❌ Wrong: Missing defaultValues
const form = useForm<CreateContactSchemaType>({
  resolver: zodResolver(CreateContactSchema),
});

// ❌ Wrong: Missing type
const form = useForm({
  resolver: zodResolver(CreateContactSchema),
  defaultValues: { name: "" },
});
```

### 4. Form State Management (P0)

- Use `useState` for loading state (not `formState.isSubmitting`)

```tsx
function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateContactSchemaType>({
    resolver: zodResolver(CreateContactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  // ...
}
```

### 5. Submit Handler (P0)

- ALWAYS use async function
- ALWAYS use FormData for API submission
- ALWAYS use try/catch with binary logic pattern (throw on error, continue on success)
- ALWAYS use `toast` for success/error feedback
- ALWAYS reset form on success
- NEVER use `request.json()` on API side
- NEVER use early return pattern (use throw instead)

```tsx
async function onSubmit(data: CreateContactSchemaType) {
  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("message", data.message);

    const response = await fetch("/api/contact", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Une erreur est survenue");
    }

    toast.success("Message envoyé avec succès");
    form.reset();
  } catch (error: unknown) {
    toast.error(
      error instanceof Error ? error.message : "Une erreur est survenue"
    );
  } finally {
    setIsLoading(false);
  }
}
```

### 6. FormData with Files (P0)

#### Single File

```tsx
async function onSubmit(data: CreateDocumentSchemaType) {
  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("name", data.name);

    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Une erreur est survenue");
    }

    toast.success("Document créé avec succès");
    form.reset();
  } catch (error: unknown) {
    toast.error(
      error instanceof Error ? error.message : "Une erreur est survenue"
    );
  } finally {
    setIsLoading(false);
  }
}
```

#### Multiple Files

```tsx
async function onSubmit(data: CreateProjectSchemaType) {
  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);

    if (data.files && data.files.length > 0) {
      data.files.forEach((file: File) => {
        formData.append("files", file);
      });
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Une erreur est survenue");
    }

    toast.success("Projet créé avec succès");
    form.reset();
  } catch (error: unknown) {
    toast.error(
      error instanceof Error ? error.message : "Une erreur est survenue"
    );
  } finally {
    setIsLoading(false);
  }
}
```

### 7. Form Component Structure (P0)

- ALWAYS use Shadcn/ui `<Form>` component
- ALWAYS use `<FormField>` with `control` and `render`
- ALWAYS include `<FormMessage />` for validation errors
- Use `<FormDescription>` when helpful
- ALWAYS disable submit button when loading
- ALWAYS show loading indicator in button

```tsx
return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom</FormLabel>
            <FormControl>
              <Input placeholder="Votre nom" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isLoading ? "Envoi en cours..." : "Envoyer"}
      </Button>
    </form>
  </Form>
);
```

### 8. File Upload with Drag & Drop (P0)

- File inputs MUST always include drag & drop functionality
- MUST show file preview after selection
- MUST allow file removal
- MUST show file size and type validation feedback

#### Single File with Drag & Drop

```tsx
<FormField
  control={form.control}
  name="file"
  render={({ field: { onChange, value, ...field } }) => {
    const [isDragging, setIsDragging] = useState(false);

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
        onChange(droppedFile);
      }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        onChange(selectedFile);
      }
    }

    function handleRemoveFile() {
      onChange(null);
    }

    return (
      <FormItem>
        <FormLabel>Document</FormLabel>
        <FormControl>
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
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                      {...field}
                    />
                  </label>
                </p>
              </>
            )}
          </div>
        </FormControl>
        <FormDescription>PDF uniquement, 10 MB maximum</FormDescription>
        <FormMessage />
      </FormItem>
    );
  }}
/>
```

#### Multiple Files with Drag & Drop

```tsx
<FormField
  control={form.control}
  name="files"
  render={({ field: { onChange, value = [], ...field } }) => {
    const [isDragging, setIsDragging] = useState(false);

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

      const droppedFiles = Array.from(event.dataTransfer.files);
      onChange([...value, ...droppedFiles]);
    }

    function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
      const selectedFiles = event.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        const newFiles = Array.from(selectedFiles);
        onChange([...value, ...newFiles]);
      }
    }

    function handleRemoveFile(index: number) {
      const updatedFiles = value.filter(
        (_: File, fileIndex: number) => fileIndex !== index
      );
      onChange(updatedFiles);
    }

    return (
      <FormItem>
        <FormLabel>Documents</FormLabel>
        <FormControl>
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <Upload
                className="text-muted-foreground mb-2 h-8 w-8"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">
                Glissez-déposez des fichiers ou{" "}
                <label className="text-primary cursor-pointer font-medium hover:underline">
                  parcourir
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleFilesChange}
                    className="sr-only"
                    {...field}
                  />
                </label>
              </p>
            </div>

            {value.length > 0 && (
              <ul className="space-y-2">
                {value.map((file: File, index: number) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Supprimer {file.name}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormControl>
        <FormDescription>
          PDF, JPG ou PNG, 10 MB maximum par fichier
        </FormDescription>
        <FormMessage />
      </FormItem>
    );
  }}
/>
```

### 9. Field Types Reference (P0)

#### Text Input

```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nom</FormLabel>
      <FormControl>
        <Input placeholder="Votre nom" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Email Input

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" placeholder="votre@email.com" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Password Input

```tsx
<FormField
  control={form.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Mot de passe</FormLabel>
      <FormControl>
        <Input type="password" placeholder="••••••••" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Textarea

```tsx
<FormField
  control={form.control}
  name="message"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Message</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Votre message..."
          className="min-h-32"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Select

```tsx
<FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Catégorie</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une catégorie" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {categories.map((category: Category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Checkbox

```tsx
<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>J'accepte les conditions d'utilisation</FormLabel>
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Switch

```tsx
<FormField
  control={form.control}
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Notifications</FormLabel>
        <FormDescription>Recevoir des notifications par email.</FormDescription>
      </div>
      <FormControl>
        <Switch checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
    </FormItem>
  )}
/>
```

### 10. Props Interface (P0)

- Use `{FormName}Props` type if form receives props
- For edit forms, pass initial data as props

```tsx
type ProfileFormProps = {
  user: {
    id: string;
    name: string;
    bio: string;
  };
};

function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateProfileSchemaType>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio,
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

`app/(protected)/dashboard/settings/_components/delete-account-form.tsx`:

```tsx
"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  DeleteAccountSchema,
  type DeleteAccountSchemaType,
} from "@/lib/schemas/account.schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type DeleteAccountFormProps = {
  userEmail: string;
  onSuccess: () => void;
};

function DeleteAccountForm({ userEmail, onSuccess }: DeleteAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DeleteAccountSchemaType>({
    resolver: zodResolver(DeleteAccountSchema),
    defaultValues: {
      confirmation: "",
    },
  });

  async function onSubmit(data: DeleteAccountSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("confirmation", data.confirmation);

      const response = await fetch("/api/account", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue");
      }

      toast.success("Compte supprimé avec succès");
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmation</FormLabel>
              <FormControl>
                <Input placeholder={userEmail} {...field} />
              </FormControl>
              <FormDescription>
                Tapez votre email pour confirmer la suppression
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="destructive"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Suppression..." : "Supprimer mon compte"}
        </Button>
      </form>
    </Form>
  );
}

export { DeleteAccountForm };
```

#### Modal File

`app/(protected)/dashboard/settings/_components/delete-account-modal.tsx`:

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

import { DeleteAccountForm } from "@/app/(protected)/dashboard/settings/_components/delete-account-form";

type DeleteAccountModalProps = {
  userEmail: string;
};

function DeleteAccountModal({ userEmail }: DeleteAccountModalProps) {
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
        <DeleteAccountForm userEmail={userEmail} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccountModal };
```

## Complete Example

### Contact Form with File Upload

`app/(public)/contact/_components/contact-form.tsx`:

```tsx
"use client";

import { type ChangeEvent, type DragEvent, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  CreateContactSchema,
  type CreateContactSchemaType,
} from "@/lib/schemas/contact.schema";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const subjectOptions = [
  { value: "general", label: "Question générale" },
  { value: "support", label: "Support technique" },
  { value: "sales", label: "Commercial" },
] as const;

type SubjectOption = (typeof subjectOptions)[number];

function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateContactSchemaType>({
    resolver: zodResolver(CreateContactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "general",
      message: "",
      attachment: undefined,
    },
  });

  async function onSubmit(data: CreateContactSchemaType) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("subject", data.subject);
      formData.append("message", data.message);

      if (data.attachment) {
        formData.append("attachment", data.attachment);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue");
      }

      toast.success("Message envoyé avec succès");
      form.reset();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="votre@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sujet</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un sujet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjectOptions.map((option: SubjectOption) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Votre message..."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>Maximum 1000 caractères</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attachment"
          render={({ field: { onChange, value, ...field } }) => {
            const [isDragging, setIsDragging] = useState(false);

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
                onChange(droppedFile);
              }
            }

            function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) {
                onChange(selectedFile);
              }
            }

            function handleRemoveFile() {
              onChange(undefined);
            }

            return (
              <FormItem>
                <FormLabel>Pièce jointe (optionnel)</FormLabel>
                <FormControl>
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
                        <span className="text-sm font-medium">
                          {value.name}
                        </span>
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
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              className="sr-only"
                              {...field}
                            />
                          </label>
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormDescription>PDF, JPG ou PNG, 5 MB maximum</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading ? "Envoi en cours..." : "Envoyer"}
        </Button>
      </form>
    </Form>
  );
}

export { ContactForm };
```

## Anti-Patterns

```tsx
// ❌ Wrong: Form logic inside modal file
// delete-account-modal.tsx
function DeleteAccountModal() {
  const form = useForm(...);  // Form should be in separate file
  return (
    <Dialog>
      <form>...</form>
    </Dialog>
  );
}

// ❌ Wrong: Inline schema definition
const form = useForm({
  resolver: zodResolver(z.object({ name: z.string() })),
});

// ❌ Wrong: Missing type on useForm
const form = useForm({
  resolver: zodResolver(CreateContactSchema),
});

// ❌ Wrong: Missing defaultValues
const form = useForm<CreateContactSchemaType>({
  resolver: zodResolver(CreateContactSchema),
});

// ❌ Wrong: Using JSON instead of FormData
const response = await fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// ❌ Wrong: Using early return instead of throw
if (!response.ok) {
  toast.error(result.message || "Une erreur est survenue");
  return; // Should throw instead
}

// ❌ Wrong: Missing response.ok check
const result = await response.json();
toast.success("Envoyé");

// ❌ Wrong: File input without drag & drop
<input type="file" onChange={handleChange} />

// ❌ Wrong: Abbreviated variable names
function handleDrop(e: DragEvent) { ... }
const res = await fetch(...);

// ❌ Wrong: Missing type in callback
{options.map((option) => ...)}

// ❌ Wrong: Missing aria-hidden on decorative icons
<Loader2 className="animate-spin" />

// ❌ Wrong: Default export
export default function ContactForm() { ... }
```

## Key Principles

1. **Separation**: Form and Modal always in separate files
2. **Schema import**: Always import Zod schema from `@/lib/schemas/`
3. **Type safety**: Always type `useForm<SchemaType>` with defaultValues
4. **FormData only**: Always use FormData for API submission
5. **Drag & Drop**: File inputs must always include drag & drop
6. **Error handling**: Zod errors via `<FormMessage />`, API errors via `toast`
7. **Loading state**: Use `useState`, show loader in button, disable button
8. **Binary logic**: Throw on error, continue on success (no early return)
9. **Reset on success**: Call `form.reset()` after successful submission
10. **Explicit naming**: Full variable names, typed callbacks
11. **Accessibility**: `aria-hidden` on icons, `sr-only` for screen readers
