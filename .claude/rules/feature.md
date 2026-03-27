---
paths:
  - "features/**"
---

# Feature Module Rules

## Structure

```
features/{feature}/
├── actions/          # Server Actions → see action.md
│   └── {verb}-{entity}.action.ts
├── components/
│   ├── forms/        # Forms → see form.md
│   │   └── {entity}-form.tsx
│   ├── modals/       # Modal imports Form (ALWAYS separate files)
│   │   └── {entity}-modal.tsx
│   └── *.tsx         # Other components
├── constants/        # Domain constants (filters, searchParams, labels, SEO)
│   └── {entity}-filters.constant.ts
├── emails/           # React Email templates
│   └── {entity}-email.tsx
├── hooks/            # Feature-specific hooks
│   └── use-{feature}.ts
├── pages/            # Feature pages + loading → see page.md
│   ├── {name}-page.tsx
│   └── {name}-loading.tsx
├── schemas/          # Zod validation
│   └── {entity}.schema.ts
└── services/         # Server-only logic → see security.md
    └── {verb}-{entity}.service.ts
```

## Naming

| Type      | Pattern                  | File                         | Example                                            |
| --------- | ------------------------ | ---------------------------- | -------------------------------------------------- |
| Schema    | `{Action}{Entity}Schema` | `{entity}.schema.ts`         | `CreateContactSchema` → `contact.schema.ts`        |
| Type      | `{SchemaName}Type`       | (same file)                  | `CreateContactSchemaType`                          |
| Action    | `{verb}{Entity}Action`   | `{verb}-{entity}.action.ts`  | `createContactAction` → `create-contact.action.ts` |
| Service   | `{verb}{Entity}`         | `{verb}-{entity}.service.ts` | `createContact` → `create-contact.service.ts`      |
| Component | PascalCase               | kebab-case.tsx               | `ContactForm` → `contact-form.tsx`                 |
| Form      | `{Entity}Form`           | `{entity}-form.tsx`          | `ProfileForm` → `profile-form.tsx`                 |
| Modal     | `{Entity}Modal`          | `{entity}-modal.tsx`         | `DeleteAccountModal` → `delete-account-modal.tsx`  |
| Email     | `{Entity}Email`          | `{entity}-email.tsx`         | `WelcomeEmail` → `welcome-email.tsx`               |
| Page      | `{Feature}Page`          | `{name}-page.tsx`            | `PricingPage` → `pricing-page.tsx`                 |
| Loading   | `{Feature}Loading`       | `{name}-loading.tsx`         | `PricingLoading` → `pricing-loading.tsx`           |
| SEO const | exported functions       | `{page}-seo.constant.ts`     | `getPricingSchema` → `pricing-seo.constant.ts`     |

## Schema Rules

- Order: Create → Update → Delete (matching POST → PATCH → DELETE)
- String chain: `.min()` → `.max()` → `.trim()` (ALWAYS this order, French messages)
- Number chain: `.min()` → `.max()` (French messages)
- Export order: schemas first, then types. Named exports only.
- One entity per file. Constants internal only (not exported).

```tsx
const CreateContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(255, "L'email doit contenir moins de 255 caractères")
    .trim()
    .email("L'email est invalide"),
});

type CreateContactSchemaType = z.infer<typeof CreateContactSchema>;

export { CreateContactSchema };
export type { CreateContactSchemaType };
```

## Component Rules

- Server Component by default, `"use client"` only for hooks/events/browser APIs
- Props: inline if ≤2, separate `{Name}Props` type if >2
- `cn()` for conditional Tailwind classes
- `aria-hidden="true"` on decorative icons
- `type="button"` on all non-submit buttons
- Empty states: separate `{entity}-empty.tsx` file

## Modal Rules

- Form and Modal MUST be separate files
- Modal manages dialog state (`isOpen`, `setIsOpen`)
- Form receives `onSuccess` callback to close modal

## Email Rules

Location: `features/{feature}/emails/{entity}-email.tsx`

Stack: `@react-email/components` (Html, Head, Body, Container, Heading, Text)

## Constant Rules

- Prisma enums: import from `prisma/browser` in constants/components
- Filter values, `searchParams` object, type guards, labels defined here
- Labels: `Record<Enum, string>` for UI display (French strings)
- NEVER `Record<string, ...>` — always use the typed enum

## Anti-Patterns

```
Wrong file locations (schemas in lib/, actions in app/, emails in components/)
Form and Modal in same file
Missing "server-only" in services
Missing "use server" in actions (or not on line 1)
Missing .trim() or wrong order (.trim() before .max())
Default exports
Inline schema in action (always import from schemas/)
react-hook-form (always TanStack Form)
```
