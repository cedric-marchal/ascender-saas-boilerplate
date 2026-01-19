# Zod Schema Creation Rules

## Context

These rules apply exclusively to creating Zod validation schemas. Schemas are used for data validation on both client and server sides.

## Rules

### 1. File Location & Naming (P0)

- All schema files MUST be in `@/lib/schemas/`
- File naming: `{entity}.schema.ts` (kebab-case)
- One file per entity

```bash
# ✅ Correct
@/lib/schemas/document.schema.ts
@/lib/schemas/user.schema.ts
@/lib/schemas/project.schema.ts

# ❌ Wrong
@/lib/schemas/documentSchema.ts
@/lib/schemas/Document.schema.ts
@/lib/schemas/user-project.schema.ts  # Multiple entities
```

### 2. Schema Naming & Ordering (P0)

- Pattern: `{Action}{Entity}Schema`
- Actions ordered to match HTTP methods: `Read` → `Create` → `Replace` → `Update` → `Delete`
- Only create schemas when needed (not all actions required)
- In practice, most common order: `Create` → `Update` → `Delete`

| HTTP Method | Zod Action | Usage                            |
| ----------- | ---------- | -------------------------------- |
| `GET`       | `Read`     | Query params validation (rare)   |
| `POST`      | `Create`   | New resource validation          |
| `PUT`       | `Replace`  | Full resource replacement (rare) |
| `PATCH`     | `Update`   | Partial resource update          |
| `DELETE`    | `Delete`   | Deletion params validation       |

```tsx
// ✅ Correct (matching HTTP method order)
const ReadUserSchema = z.object({ ... });    // GET (if needed)
const CreateUserSchema = z.object({ ... });  // POST
const UpdateUserSchema = z.object({ ... });  // PATCH
const DeleteUserSchema = z.object({ ... });  // DELETE

// ✅ Correct (common case without Read/Replace)
const CreateUserSchema = z.object({ ... });
const UpdateUserSchema = z.object({ ... });
const DeleteUserSchema = z.object({ ... });

// ❌ Wrong (wrong order)
const DeleteUserSchema = z.object({ ... });
const CreateUserSchema = z.object({ ... });
const UpdateUserSchema = z.object({ ... });
```

### 3. Type Naming (P0)

- Pattern: `{SchemaName}Type`
- Every schema MUST have its corresponding inferred type
- Types MUST be in the same order as schemas
- Types MUST be declared after all schemas (bottom of file)

```tsx
// ✅ Correct
type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;
type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
type DeleteUserSchemaType = z.infer<typeof DeleteUserSchema>;

// ❌ Wrong
type CreateUserType = z.infer<typeof CreateUserSchema>; // Missing "Schema" in name
type UserCreateSchemaType = z.infer<typeof CreateUserSchema>; // Wrong pattern
```

### 4. String Validation (P0)

- ALWAYS define `.min()` and `.max()`
- ALWAYS end with `.trim()` after `.max()`
- ALWAYS include error messages in French

```tsx
// ✅ Correct
name: z
  .string()
  .min(1, "Le nom est requis")
  .max(200, "Le nom doit contenir moins de 200 caractères")
  .trim(),

// ❌ Wrong: missing min/max
name: z.string().trim(),

// ❌ Wrong: trim before max
name: z.string().min(1).trim().max(200),

// ❌ Wrong: missing error messages
name: z.string().min(1).max(200).trim(),
```

### 5. Number Validation (P0)

- ALWAYS define `.min()` and `.max()` (or `.positive()`, `.nonnegative()`, etc.)
- ALWAYS include error messages in French

```tsx
// ✅ Correct
age: z
  .number()
  .min(0, "L'âge doit être positif")
  .max(150, "L'âge doit être inférieur à 150"),

price: z
  .number()
  .min(0, "Le prix doit être positif")
  .max(1000000, "Le prix doit être inférieur à 1 000 000€"),

// ❌ Wrong: missing min/max
age: z.number(),

// ❌ Wrong: missing error messages
age: z.number().min(0).max(150),
```

### 6. Constants (P1)

- Constants used in schemas MUST be defined at the top of the file
- Constants MUST NOT be exported (internal use only)
- Use SCREAMING_SNAKE_CASE

```tsx
// ✅ Correct
const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const CreateDocumentSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "..."),
});

// ❌ Wrong: exported constant
export const MAX_FILE_SIZE = ...;

// ❌ Wrong: inline magic value
.refine((file) => file.size <= 10485760, "...")
```

### 7. File Structure (P0)

Follow this exact order:

1. Imports
2. _(empty line)_
3. Constants (internal only)
4. _(empty line)_
5. Schemas (HTTP method order: Read → Create → Replace → Update → Delete)
6. _(empty line)_
7. Types (same order as schemas)
8. _(empty line)_
9. Export schemas (same order)
10. _(empty line)_
11. Export types (same order)

```tsx
// 1. Imports
import { z } from "zod";

import { env } from "@/lib/env";

// 2. Constants
const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ACCEPTED_FILE_TYPES = ["application/pdf"];

// 3. Schemas (HTTP method order)
const CreateDocumentSchema = z.object({ ... });  // POST
const UpdateDocumentSchema = z.object({ ... });  // PATCH
const DeleteDocumentSchema = z.object({ ... });  // DELETE

// 4. Types (same order)
type CreateDocumentSchemaType = z.infer<typeof CreateDocumentSchema>;
type UpdateDocumentSchemaType = z.infer<typeof UpdateDocumentSchema>;
type DeleteDocumentSchemaType = z.infer<typeof DeleteDocumentSchema>;

// 5. Export schemas (same order)
export {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  DeleteDocumentSchema,
};

// 6. Export types (same order)
export type {
  CreateDocumentSchemaType,
  UpdateDocumentSchemaType,
  DeleteDocumentSchemaType,
};
```

## Complete Example

`@/lib/schemas/document.schema.ts`:

```tsx
import { z } from "zod";

import { env } from "@/lib/env";

const MAX_FILE_SIZE = env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE;
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const CreateDocumentSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "Le fichier est trop volumineux (max 10MB)"
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Format non supporté (PDF uniquement)"
    ),
});

const UpdateDocumentSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
});

const DeleteDocumentSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
});

type CreateDocumentSchemaType = z.infer<typeof CreateDocumentSchema>;
type UpdateDocumentSchemaType = z.infer<typeof UpdateDocumentSchema>;
type DeleteDocumentSchemaType = z.infer<typeof DeleteDocumentSchema>;

export { CreateDocumentSchema, UpdateDocumentSchema, DeleteDocumentSchema };

export type {
  CreateDocumentSchemaType,
  UpdateDocumentSchemaType,
  DeleteDocumentSchemaType,
};
```

## Complete Example with Read Schema

`@/lib/schemas/user.schema.ts`:

```tsx
import { z } from "zod";

const ReadUserSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
});

const CreateUserSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "L'email doit contenir moins de 255 caractères")
    .trim()
    .email("L'email est invalide"),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
  age: z
    .number()
    .min(0, "L'âge doit être positif")
    .max(150, "L'âge doit être inférieur à 150"),
});

const UpdateUserSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
});

const DeleteUserSchema = z.object({
  id: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(36, "L'identifiant est invalide")
    .trim(),
});

type ReadUserSchemaType = z.infer<typeof ReadUserSchema>;
type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;
type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
type DeleteUserSchemaType = z.infer<typeof DeleteUserSchema>;

export { ReadUserSchema, CreateUserSchema, UpdateUserSchema, DeleteUserSchema };

export type {
  ReadUserSchemaType,
  CreateUserSchemaType,
  UpdateUserSchemaType,
  DeleteUserSchemaType,
};
```

## Anti-Patterns

```tsx
// ❌ Wrong: missing min/max on string
email: z.string().email().trim(),

// ❌ Wrong: trim before max
name: z.string().min(1).trim().max(200),

// ❌ Wrong: missing error messages
name: z.string().min(1).max(200).trim(),

// ❌ Wrong: exported constants
export const MAX_FILE_SIZE = 10485760;

// ❌ Wrong: schemas not in HTTP method order
const DeleteUserSchema = z.object({ ... });
const CreateUserSchema = z.object({ ... });
const UpdateUserSchema = z.object({ ... });

// ❌ Wrong: type not matching schema name
type CreateUserType = z.infer<typeof CreateUserSchema>;

// ❌ Wrong: types mixed with schemas
const CreateUserSchema = z.object({ ... });
type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;
const UpdateUserSchema = z.object({ ... });

// ❌ Wrong: no empty line between export and export type
export { CreateDocumentSchema };
export type { CreateDocumentSchemaType };

// ❌ Wrong: multiple entities in one file
// document.schema.ts
const CreateDocumentSchema = z.object({ ... });
const CreateUserSchema = z.object({ ... });  // Should be in user.schema.ts
```

## Key Principles

1. **One entity, one file**: Keep schemas organized by domain
2. **HTTP method ordering**: Read → Create → Replace → Update → Delete (matching GET → POST → PUT → PATCH → DELETE)
3. **Mandatory bounds**: Every string and number must have min/max
4. **Trim last**: Always `.trim()` after `.max()` for strings
5. **French error messages**: User-facing validation messages in French
6. **Internal constants**: Schema constants are not exported
7. **Type inference**: Every schema has its `{SchemaName}Type`
8. **Clear separation**: Empty line between `export` and `export type`

```

```
