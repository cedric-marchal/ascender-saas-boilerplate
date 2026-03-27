---
paths:
  - "app/api/**"
---

# API Route Rules

## Context

HTTP route handlers in Next.js App Router (`route.ts` files).

## File Location (P0)

`app/api/{resource}/route.ts`

## Structure (P0)

```tsx
import { NextResponse } from "next/server";

import { UpdateAvatarSchema } from "@/features/account/schemas/avatar.schema";
import { updateAvatar } from "@/features/account/services/update-avatar.service";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const formData = await request.formData();

    const data = UpdateAvatarSchema.parse({
      avatar: formData.get("avatar"),
    });

    const result = await updateAvatar({
      userId: session.user.id,
      avatar: data.avatar,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
```

## Rules (P0)

| Rule              | Convention                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Order**         | GET → POST → PATCH → DELETE                                                                                                 |
| **Export**        | Named, at end, in HTTP order: `export { GET, POST, DELETE };`                                                               |
| **Data parsing**  | `request.formData()` (never `.json()`)                                                                                      |
| **Validation**    | Zod `.parse()` (throws automatically)                                                                                       |
| **Error type**    | `catch (error: unknown)`                                                                                                    |
| **Error handler** | `return handleApiError(error)`                                                                                              |
| **Imports**       | Schemas from `@/features/{feature}/schemas/`, services from `@/features/{feature}/services/`, errors from `@/utils/errors/` |
| **Delegation**    | Delegate business logic to services                                                                                         |
| **Prisma**        | Always `select`                                                                                                             |
| **Status codes**  | 200 (GET/PATCH), 201 (POST), 204 (DELETE)                                                                                   |

## Error Classes (P0)

Import from `@/utils/errors/errors`:

| Class                      | Status | Usage          |
| -------------------------- | ------ | -------------- |
| `BadRequestError`          | 400    | Invalid input  |
| `UnauthorizedError`        | 401    | No session     |
| `ForbiddenError`           | 403    | Not allowed    |
| `NotFoundError`            | 404    | Not found      |
| `ConflictError`            | 409    | Duplicate      |
| `PayloadTooLargeError`     | 413    | Too large      |
| `UnprocessableEntityError` | 422    | Semantic error |
| `TooManyRequestsError`     | 429    | Rate limited   |

## Route Params (P0)

Type: `Promise<{ id: string }>`

Always await before using:

```tsx
type RouteParams = {
  params: Promise<{ id: string }>;
};

async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params; // ← Always await

  if (!id) {
    throw new BadRequestError("ID requis");
  }
  // ...
}
```

## Response Format (P0)

Success with data:

```tsx
return NextResponse.json({ success: true, data: result }, { status: 201 });
```

Success no data (DELETE):

```tsx
return new NextResponse(null, { status: 204 });
```

## Complete Example

```tsx
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { CreateDocumentSchema } from "@/features/documents/schemas/document.schema";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID requis");
    }

    const authSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: {
        id,
      },
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

    return NextResponse.json(
      { success: true, data: document },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function POST(request: Request) {
  try {
    const authSession = await auth.api.getSession({ headers: await headers() });
    if (!authSession?.user)
      throw new UnauthorizedError("Vous devez être connecté");

    const formData = await request.formData();
    const data = CreateDocumentSchema.parse({ name: formData.get("name") });

    const document = await prisma.document.create({
      data: { ...data, userId: authSession.user.id },
      select: { id: true, name: true },
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      throw new BadRequestError("ID requis");
    }

    const authSession = await auth.api.getSession({ headers: await headers() });

    if (!authSession?.user) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    const document = await prisma.document.findUnique({
      where: {
        id,
      },
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
      where: {
        id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { GET, POST, DELETE };
```

## Anti-Patterns

```tsx
// ❌ Wrong: Schema path
import { CreateContactSchema } from "@/lib/schemas/contact.schema";
// ✅ Correct: import from features
import { CreateContactSchema } from "@/features/contact/schemas/contact.schema";

// ❌ Wrong: Error imports
import { BadRequestError, handleApiError } from "@/utils/api/handle-api-error";
// ✅ Correct: separate files
import { BadRequestError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";

// ❌ Wrong: Email path
import { ContactEmail } from "@/components/emails/contact-email";
// ✅ Correct: import from features
import { ContactEmail } from "@/features/contact/emails/contact-email";

// ❌ Wrong: Using .json()
const data = await request.json();

// ❌ Wrong: Prisma without select
const user = await prisma.user.findUnique({
  where: {
    id
  }
});

// ❌ Wrong: Not awaiting params
async function GET(request: Request, { params }: RouteParams) {
  const { id } = params; // ❌ Missing await

// ❌ Wrong: Wrong status code
return NextResponse.json({ success: true, data }, { status: 200 }); // POST should be 201
return NextResponse.json({ success: true }, { status: 200 }); // DELETE should be 204 with no body

// ❌ Wrong: Default export
export default async function handler() { ... }

// ❌ Wrong: Inline export
export async function POST() { ... }

// ❌ Wrong: Wrong export order
export { DELETE, POST, GET }; // Should be: GET, POST, DELETE
```
