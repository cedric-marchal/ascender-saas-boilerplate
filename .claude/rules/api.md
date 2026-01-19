# API Route Creation Rules

## Context

These rules apply exclusively to creating new API Route Handlers (`route.ts` files) in the Next.js App Router structure. Routes follow a binary error handling pattern: either success or throw a custom error.

## Rules

### 1. File Location & Naming (P0)

- All routes MUST be in `app/api/...`
- File naming: `route.ts`
- Use folder structure for REST resources

```bash
# ✅ Correct
app/api/contact/route.ts
app/api/documents/route.ts
app/api/documents/[id]/route.ts
app/api/users/[id]/documents/route.ts

# ❌ Wrong
app/api/contact.ts
app/api/getDocuments/route.ts
app/api/document-delete/route.ts
```

### 2. Function Naming & Export (P0)

- Use HTTP method names: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- MUST use named export at the end of the file
- NEVER use default export
- Export in HTTP method order: `GET` → `POST` → `PUT` → `PATCH` → `DELETE`

```tsx
// ✅ Correct
async function GET(request: Request) { ... }
async function POST(request: Request) { ... }
async function DELETE(request: Request) { ... }

export { GET, POST, DELETE };

// ❌ Wrong: default export
export default async function handler() { ... }

// ❌ Wrong: inline export
export async function POST() { ... }

// ❌ Wrong: wrong order
export { DELETE, POST, GET };
```

### 3. File Structure (P0)

Follow this exact order:
1. Imports (Next.js → libs → schemas → components → utils)
2. Constants (internal only)
3. Type declarations (RouteParams if needed)
4. Handler functions (HTTP method order)
5. Exports (HTTP method order)

```tsx
// 1. Imports
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  BadRequestError,
  ForbiddenError,
  handleApiError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/api/handle-api-error";

// 2. Constants
const MAX_DOCUMENTS_PER_USER = 100;

// 3. Type declarations
type RouteParams = {
  params: Promise<{ id: string }>;
};

// 4. Handler functions (HTTP method order)
async function GET(request: Request, { params }: RouteParams) { ... }
async function POST(request: Request) { ... }
async function PATCH(request: Request, { params }: RouteParams) { ... }
async function DELETE(request: Request, { params }: RouteParams) { ... }

// 5. Exports (HTTP method order)
export { GET, POST, PATCH, DELETE };
```

### 4. Binary Error Handling Pattern (P0)

- ALWAYS wrap handler logic in `try/catch`
- ALWAYS use custom error classes for expected errors
- ALWAYS use `handleApiError(error)` in catch block
- ALWAYS type error as `unknown`
- NO multiple returns in the try block (except final success)
- Each validation step throws or continues (early throw pattern)

```tsx
// ✅ Correct: binary pattern (throw or continue)
async function POST(request: Request) {
  try {
    // Step 1: Auth - throws or continues
    const session = await getAuthSession();

    // Step 2: Validation - throws or continues
    const data = await validateFormData(request);

    // Step 3: Business logic - throws or continues
    const document = await createDocument(data, session.user.id);

    // Step 4: Success (only return in try block)
    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// ❌ Wrong: multiple returns, if/else logic
async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    if (!data.get("name")) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    // ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 5. Authentication (P0)

- ALWAYS check authentication first in protected routes
- Throw `UnauthorizedError` if no session
- Throw `ForbiddenError` if user lacks permission

```tsx
async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    return NextResponse.json({ success: true, data: document }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### 6. Request Data Validation (P0)

- ALWAYS use `request.formData()` (never `request.json()`)
- ALWAYS validate with Zod schema using `.parse()`
- Zod throws automatically on invalid data (caught by handleApiError)

```tsx
async function POST(request: Request) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      file: formData.get("file"),
    });

    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### 7. Route Parameters (P0)

- Type params as `Promise<{ paramName: string }>`
- ALWAYS await params before using
- Validate required params with `BadRequestError`

```tsx
type RouteParams = {
  params: Promise<{ id: string }>;
};

async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID du document requis");
    }

    // ...
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### 8. HTTP Status Codes (P0)

| Method | Success Action | Status Code |
|--------|---------------|-------------|
| `GET` | Resource(s) retrieved | `200` |
| `POST` | Resource created | `201` |
| `PUT` | Resource replaced | `200` |
| `PATCH` | Resource updated | `200` |
| `DELETE` | Resource deleted | `204` |

```tsx
// GET - Retrieval
return NextResponse.json({ success: true, data: document }, { status: 200 });

// GET - List retrieval
return NextResponse.json({ success: true, data: documents }, { status: 200 });

// POST - Creation
return NextResponse.json({ success: true, data: document }, { status: 201 });

// PUT/PATCH - Update
return NextResponse.json({ success: true, data: document }, { status: 200 });

// DELETE - Deletion (no body)
return new NextResponse(null, { status: 204 });
```

### 9. Prisma Queries (P0)

- ALWAYS use `select` to specify returned fields (no exceptions except rare cases)
- NEVER return raw database objects with all fields
- Use `Promise.all` for parallel independent queries
- Use `Promise.allSettled` when failures should not block other queries

```tsx
// ✅ Correct: explicit select
const document = await prisma.document.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    description: true,
    createdAt: true,
  },
});

// ✅ Correct: parallel queries with Promise.all
const [document, relatedItems, userStats] = await Promise.all([
  prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  }),
  prisma.item.findMany({
    where: { documentId: id },
    select: {
      id: true,
      title: true,
    },
  }),
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      documentsCount: true,
    },
  }),
]);

// ✅ Correct: Promise.allSettled for non-critical parallel operations
const [mainResult, analyticsResult] = await Promise.allSettled([
  prisma.document.create({ data, select: { id: true, name: true } }),
  prisma.analytics.create({ data: { event: "document_created" } }),
]);

if (mainResult.status === "rejected") {
  throw mainResult.reason;
}

// ❌ Wrong: no select (returns all fields)
const document = await prisma.document.findUnique({
  where: { id },
});

// ❌ Wrong: sequential queries that could be parallel
const document = await prisma.document.findUnique({ where: { id } });
const items = await prisma.item.findMany({ where: { documentId: id } });
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### 10. Response Format (P0)

- Success with data: `{ success: true, data: <selected_fields> }`
- Success without data: `{ success: true }` or empty body (204)
- Data MUST come from Prisma `select` (already filtered)

```tsx
// ✅ Correct: data from select
const document = await prisma.document.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    createdAt: true,
  },
});

return NextResponse.json({ success: true, data: document }, { status: 200 });

// ❌ Wrong: manual filtering after query
const document = await prisma.document.findUnique({ where: { id } });
const { password, ...safeDocument } = document;
return NextResponse.json({ success: true, data: safeDocument });
```

### 11. Error Classes Usage (P0)

| Error Class | HTTP Status | Usage |
|-------------|-------------|-------|
| `BadRequestError` | 400 | Invalid input, missing required params |
| `UnauthorizedError` | 401 | No authentication / invalid session |
| `ForbiddenError` | 403 | Authenticated but not allowed |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Duplicate resource, state conflict |
| `PayloadTooLargeError` | 413 | File/request too large |
| `UnprocessableEntityError` | 422 | Valid syntax but semantic error |
| `TooManyRequestsError` | 429 | Rate limit exceeded |

```tsx
// Missing param
if (!id) {
  throw new BadRequestError("ID du document requis");
}

// No session
if (!authSession?.user) {
  throw new UnauthorizedError("Vous devez être connecté");
}

// Wrong owner
if (document.userId !== authSession.user.id) {
  throw new ForbiddenError("Accès non autorisé");
}

// Resource not found
if (!document) {
  throw new NotFoundError("Document introuvable");
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

## Complete Examples

### Simple Route (Contact Form)

`app/api/contact/route.ts`:

```tsx
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { resend } from "@/lib/resend";

import { CreateContactSchema } from "@/lib/schemas/contact.schema";

import { ContactEmail } from "@/components/emails/contact-email";

import { handleApiError } from "@/utils/api/handle-api-error";

const CONTACT_EMAIL = "contact@example.com";

async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const data = CreateContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });

    await resend.emails.send({
      from: `${env.NEXT_PUBLIC_APP_NAME} <noreply@${env.RESEND_DOMAIN}>`,
      to: CONTACT_EMAIL,
      replyTo: data.email,
      subject: `[Contact] ${data.subject}`,
      react: ContactEmail({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      }),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
```

### Collection Route (List & Create)

`app/api/documents/route.ts`:

```tsx
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  handleApiError,
  UnauthorizedError,
} from "@/utils/api/handle-api-error";

async function GET(request: Request) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const documents = await prisma.document.findMany({
      where: { userId: authSession.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: documents }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function POST(request: Request) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const document = await prisma.document.create({
      data: {
        ...data,
        userId: authSession.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { GET, POST };
```

### Resource Route with Parallel Queries

`app/api/documents/[id]/route.ts`:

```tsx
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { UpdateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  BadRequestError,
  ForbiddenError,
  handleApiError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/api/handle-api-error";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID du document requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    // Parallel queries for better performance
    const [document, relatedItems] = await Promise.all([
      prisma.document.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      }),
      prisma.item.findMany({
        where: { documentId: id },
        select: {
          id: true,
          title: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
    ]);

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        items: relatedItems,
      },
    }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID du document requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    const formData = await request.formData();

    const data = UpdateDocumentSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
    });

    const updatedDocument = await prisma.document.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedDocument }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID du document requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!document) {
      throw new NotFoundError("Document introuvable");
    }

    if (document.userId !== authSession.user.id) {
      throw new ForbiddenError("Accès non autorisé");
    }

    await prisma.document.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { GET, PATCH, DELETE };
```

## Anti-Patterns

```tsx
// ❌ Wrong: using request.json() instead of formData()
const data = await request.json();

// ❌ Wrong: multiple returns in try block
async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ...
  } catch (error) { ... }
}

// ❌ Wrong: not using custom error classes
if (!document) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// ❌ Wrong: Prisma query without select
const document = await prisma.document.findUnique({
  where: { id },
});

// ❌ Wrong: sequential queries that could be parallel
const document = await prisma.document.findUnique({ where: { id } });
const items = await prisma.item.findMany({ where: { documentId: id } });
const user = await prisma.user.findUnique({ where: { id: userId } });

// ❌ Wrong: manual filtering instead of select
const document = await prisma.document.findUnique({ where: { id } });
const { password, ...safeDocument } = document;

// ❌ Wrong: not awaiting params
async function GET(request: Request, { params }: RouteParams) {
  const { id } = params; // Missing await
}

// ❌ Wrong: inline export
export async function POST(request: Request) { ... }

// ❌ Wrong: default export
export default async function handler() { ... }

// ❌ Wrong: wrong export order (should be: GET, POST, PATCH, DELETE)
export { DELETE, POST, GET };

// ❌ Wrong: not typing error as unknown
catch (error) { // Should be: catch (error: unknown)
  return handleApiError(error);
}

// ❌ Wrong: wrong status code for creation
return NextResponse.json({ success: true, data }, { status: 200 }); // Should be 201

// ❌ Wrong: returning body on DELETE
return NextResponse.json({ success: true }, { status: 200 }); // Should be 204 with no body
```

## Key Principles

1. **Binary error handling**: Either success or throw (no multiple returns)
2. **Early throw pattern**: Each validation step throws or continues
3. **Custom error classes**: Use typed errors for expected failures
4. **FormData always**: Never use `request.json()`
5. **Zod validation**: Schema validates and throws automatically
6. **Prisma select always**: Explicitly select fields, never return all
7. **Parallel queries**: Use `Promise.all` for independent queries
8. **HTTP method ordering**: Functions and exports follow GET → POST → PUT → PATCH → DELETE
9. **Proper status codes**: 200 for read/update, 201 for create, 204 for delete
10. **Await params**: Always await route parameters before using
11. **Named exports**: No default exports, no inline exports
12. **Type error as unknown**: Always `catch (error: unknown)`
```