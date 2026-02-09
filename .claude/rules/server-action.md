# Server Action Creation Rules

## Context

These rules apply exclusively to creating Server Actions in Next.js App Router. Server Actions are asynchronous functions that run on the server and can be called directly from Client Components.

## Rules

### 1. File Location & Naming (P0)

- All Server Actions MUST be in `app/actions/` folder
- File naming: `{entity}-actions.ts` (kebab-case)
- One file per entity/domain

```bash
# ✅ Correct
app/actions/document-actions.ts
app/actions/user-actions.ts
app/actions/project-actions.ts

# ❌ Wrong
app/actions/documentActions.ts
app/actions/Documents.ts
app/actions/actions.ts  # Too generic
```

### 2. File Structure (P0)

Follow this exact order:

1. `"use server"` directive (MUST be first line)
2. _(empty line)_
3. Imports (Next.js → libs → schemas → utils)
4. _(empty line)_
5. Type declarations (Result types)
6. _(empty line)_
7. Action functions
8. _(empty line)_
9. Exports (named exports only)

```tsx
// 1. Directive
"use server";

// 2. Imports
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import { handleActionError } from "@/utils/actions/handle-action-error";
import { NotFoundError, UnauthorizedError } from "@/utils/errors/errors";

// 3. Type declarations
type CreateDocumentResult =
  | { success: true; data: { id: string; name: string } }
  | { success: false; error: string; type: string };

type DeleteDocumentResult =
  | { success: true }
  | { success: false; error: string; type: string };

// 4. Action functions
async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    // Auth
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    // Validation
    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
    });

    // Business logic
    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Success
    return {
      success: true,
      data: document,
    };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

async function deleteDocumentAction(
  documentId: string
): Promise<DeleteDocumentResult> {
  try {
    // Auth
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    // Check existence and ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new UnauthorizedError("Accès non autorisé");
    }

    // Delete
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Success
    return { success: true };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

// 5. Exports (named exports only)
export { createDocumentAction, deleteDocumentAction };
```

### 3. Naming Conventions (P0)

- Function name: `{verb}{Entity}Action`
- ALWAYS use Action suffix
- Use descriptive verbs: `create`, `update`, `delete`, `toggle`, `archive`, etc.

```tsx
// ✅ Correct
createDocumentAction
updateDocumentAction
deleteDocumentAction
toggleDocumentVisibilityAction
archiveDocumentAction

// ❌ Wrong
createDocument          // Missing "Action" suffix
documentCreate          // Wrong order
create                  // Too generic
handleDocumentCreation  // Use "create" not "handle"
```

### 4. Result Types (P0)

- ALWAYS define explicit return types
- Use discriminated union: `{ success: true, data } | { success: false, error, type }`
- Include `type` field for error categorization

```tsx
// ✅ Correct: Explicit result type with data
type CreateDocumentResult =
  | { success: true; data: { id: string; name: string } }
  | { success: false; error: string; type: string };

async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  // ...
}

// ✅ Correct: Explicit result type without data
type DeleteDocumentResult =
  | { success: true }
  | { success: false; error: string; type: string };

async function deleteDocumentAction(
  id: string
): Promise<DeleteDocumentResult> {
  // ...
}

// ❌ Wrong: No explicit return type
async function createDocumentAction(formData: FormData) {
  // ...
}

// ❌ Wrong: Generic return type
async function createDocumentAction(
  formData: FormData
): Promise<{ success: boolean }> {
  // ...
}
```

### 5. Binary Error Handling Pattern (P0)

- ALWAYS wrap action logic in `try/catch`
- ALWAYS use custom error classes (same as API Routes)
- ALWAYS use `handleActionError(error)` in catch block
- ALWAYS type error as `unknown`
- NO multiple returns in try block (except final success)

```tsx
// ✅ Correct: Binary pattern
async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    // Step 1: Auth - throws or continues
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    // Step 2: Validation - throws or continues
    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
    });

    // Step 3: Business logic - throws or continues
    const document = await prisma.document.create({ ... });

    // Step 4: Success (only return in try block)
    return { success: true, data: document };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

// ❌ Wrong: Multiple returns in try block
async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      return { success: false, error: "Non autorisé" }; // Wrong
    }

    const document = await prisma.document.create({ ... });
    return { success: true, data: document };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
```

### 6. Authentication (P0)

- ALWAYS check authentication first
- Throw `UnauthorizedError` if no session
- Use `auth.api.getSession({ headers: await headers() })`

```tsx
async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    // Rest of logic...
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
```

### 7. Data Validation (P0)

- ALWAYS validate with Zod schema using `.parse()`
- Extract data from `FormData` explicitly
- Zod throws automatically on invalid data (caught by `handleActionError`)

```tsx
async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      file: formData.get("file"),
    });

    // Use validated data
    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return { success: true, data: document };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
```

### 8. Parameters (P0)

- For single values: use typed parameters
- For multiple values: use `FormData`
- ALWAYS type parameters explicitly

```tsx
// ✅ Correct: Single parameter
async function deleteDocumentAction(
  documentId: string
): Promise<DeleteDocumentResult> {
  // ...
}

// ✅ Correct: Multiple parameters via FormData
async function updateDocumentAction(
  formData: FormData
): Promise<UpdateDocumentResult> {
  const data = UpdateDocumentSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  // ...
}

// ❌ Wrong: Multiple untyped parameters
async function updateDocumentAction(id, name, description) {
  // ...
}
```

### 9. Prisma Queries (P0)

- ALWAYS use `select` to specify returned fields
- Use `Promise.all` for parallel independent queries
- NEVER return raw database objects with all fields

```tsx
// ✅ Correct: explicit select
const document = await prisma.document.create({
  data: { ... },
  select: {
    id: true,
    name: true,
    createdAt: true,
  },
});

// ✅ Correct: parallel queries
const [document, relatedItems] = await Promise.all([
  prisma.document.findUnique({
    where: { id },
    select: { id: true, name: true },
  }),
  prisma.item.findMany({
    where: { documentId: id },
    select: { id: true, title: true },
  }),
]);

// ❌ Wrong: no select
const document = await prisma.document.create({
  data: { ... },
});

// ❌ Wrong: sequential queries that could be parallel
const document = await prisma.document.findUnique({ where: { id } });
const items = await prisma.item.findMany({ where: { documentId: id } });
```

### 10. Error Classes Usage (P0)

Same error classes as API Routes:

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
// Missing resource
if (!document) {
  throw new NotFoundError("Document introuvable");
}

// Wrong owner
if (document.userId !== authSession.user.id) {
  throw new UnauthorizedError("Accès non autorisé");
}

// Duplicate
const existing = await prisma.document.findFirst({
  where: { name },
  select: { id: true },
});

if (existing) {
  throw new ConflictError("Un document avec ce nom existe déjà");
}
```

### 11. Client-Side Usage (P0)

In components calling the action:

```tsx
"use client";

import { useState } from "react";

import { toast } from "sonner";

import { createDocumentAction } from "@/app/actions/document-actions";

function DocumentForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    try {
      const result = await createDocumentAction(formData);

      if (!result.success) {
        // Handle error based on type
        if (result.type === "UnauthorizedError") {
          toast.error(result.error);
          redirect("/connexion");
        } else if (result.type === "ConflictError") {
          toast.error(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      // Handle success
      toast.success("Document créé avec succès");
      // Use result.data
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### 12. Revalidation (P1)

- Use `revalidatePath()` or `revalidateTag()` when data changes
- Call BEFORE returning success

```tsx
import { revalidatePath } from "next/cache";

async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    // Auth, validation, etc.

    const document = await prisma.document.create({ ... });

    // Revalidate before returning
    revalidatePath("/dashboard/documents");

    return { success: true, data: document };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
```

## Complete Example

`app/actions/document-actions.ts`:

```tsx
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from "@/lib/schemas/document.schema";

import { handleActionError } from "@/utils/actions/handle-action-error";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors/errors";

type CreateDocumentResult =
  | { success: true; data: { id: string; name: string } }
  | { success: false; error: string; type: string };

type UpdateDocumentResult =
  | { success: true; data: { id: string; name: string } }
  | { success: false; error: string; type: string };

type DeleteDocumentResult =
  | { success: true }
  | { success: false; error: string; type: string };

async function createDocumentAction(
  formData: FormData
): Promise<CreateDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const existing = await prisma.document.findFirst({
      where: {
        name: data.name,
        userId: authSession.user.id,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictError("Un document avec ce nom existe déjà");
    }

    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/dashboard/documents");

    return {
      success: true,
      data: document,
    };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

async function updateDocumentAction(
  formData: FormData
): Promise<UpdateDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const data = UpdateDocumentSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const document = await prisma.document.findUnique({
      where: { id: data.id },
      select: { id: true, userId: true },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new UnauthorizedError("Accès non autorisé");
    }

    const updatedDocument = await prisma.document.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/dashboard/documents");

    return {
      success: true,
      data: updatedDocument,
    };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

async function deleteDocumentAction(
  documentId: string
): Promise<DeleteDocumentResult> {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new UnauthorizedError("Accès non autorisé");
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    revalidatePath("/dashboard/documents");

    return { success: true };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

export { createDocumentAction, deleteDocumentAction, updateDocumentAction };
```

## Anti-Patterns

```tsx
// ❌ Wrong: Missing "use server"
import { headers } from "next/headers";

async function createDocumentAction() { ... }

// ❌ Wrong: No explicit return type
async function createDocumentAction(formData: FormData) {
  // ...
}

// ❌ Wrong: Multiple returns in try block
try {
  if (!user) {
    return { success: false, error: "..." };
  }
  return { success: true, data };
} catch { ... }

// ❌ Wrong: Not using handleActionError
catch (error: unknown) {
  return { success: false, error: "Une erreur est survenue" };
}

// ❌ Wrong: Default export
export default async function createDocument() { ... }

// ❌ Wrong: Generic function name
async function create() { ... }

// ❌ Wrong: Missing "Action" suffix
async function createDocument() { ... }

// ❌ Wrong: Not typing error as unknown
catch (error) {
  return handleActionError(error);
}

// ❌ Wrong: Prisma query without select
const document = await prisma.document.create({
  data: { ... },
});

// ❌ Wrong: No type field in error result
type Result =
  | { success: true; data: T }
  | { success: false; error: string }; // Missing type field
```

## Key Principles

1. **"use server" first**: MUST be the very first line
2. **Binary error handling**: Either success or throw (no multiple returns)
3. **Custom error classes**: Same as API Routes for consistency
4. **Explicit return types**: Always define discriminated unions with `type` field
5. **Named exports only**: No default exports
6. **Action suffix**: All functions end with "Action"
7. **Type error as unknown**: Always `catch (error: unknown)`
8. **Prisma select always**: Explicitly select fields, never return all
9. **Revalidate on mutation**: Call `revalidatePath()` or `revalidateTag()` before returning
10. **Type field for errors**: Include `type` in error result for client-side handling
