# Ascender SaaS Boilerplate — Référence Complète de la Codebase

> Ce document est une copie explicite et exhaustive de toutes les conventions, patterns et règles du projet Ascender SaaS Boilerplate. Il sert de référence pour qu'un LLM externe (ChatGPT ou autre) comprenne parfaitement la codebase sans accès au code source.

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Architecture en couches (Source of Truth)](#4-architecture-en-couches-source-of-truth)
5. [Principes fondamentaux](#5-principes-fondamentaux)
6. [Conventions de nommage](#6-conventions-de-nommage)
7. [Conventions de code](#7-conventions-de-code)
8. [Composants](#8-composants)
9. [Pages](#9-pages)
10. [Loading Pages](#10-loading-pages)
11. [Formulaires (TanStack Form)](#11-formulaires-tanstack-form)
12. [Schémas Zod](#12-schémas-zod)
13. [Routes API](#13-routes-api)
14. [Server Actions (next-safe-action)](#14-server-actions-next-safe-action)
15. [Filtres, Tri & Pagination (Nuqs)](#15-filtres-tri--pagination-nuqs)
16. [Authentification & Autorisation](#16-authentification--autorisation)
17. [Gestion des erreurs](#17-gestion-des-erreurs)
18. [Prisma (Base de données)](#18-prisma-base-de-données)
19. [Traitement des chaînes de caractères](#19-traitement-des-chaînes-de-caractères)
20. [Anti-Patterns (Ce qu'il ne faut JAMAIS faire)](#20-anti-patterns-ce-quil-ne-faut-jamais-faire)

---

## 1. Vue d'ensemble du projet

Ascender est un **boilerplate SaaS** production-ready construit avec Next.js 16 App Router. Il fournit :

- Authentification multi-providers (email/password + Google OAuth)
- Gestion d'abonnements Stripe
- Dashboard utilisateur + Panel admin
- Système de filtres/tri/pagination URL-based côté serveur
- Upload de fichiers (Cloudflare R2)
- Emails transactionnels (React Email + Resend)
- Monitoring (Sentry)
- Rate limiting (Upstash Redis)

**Langue du code** : anglais
**Langue des messages utilisateur** : français

---

## 2. Stack technique

| Catégorie       | Technologie                         | Version |
| --------------- | ----------------------------------- | ------- |
| Framework       | Next.js (App Router)                | 16.1.x  |
| Runtime         | React                               | 19.x    |
| Langage         | TypeScript (strict mode)            | 5.9.x   |
| Styling         | Tailwind CSS                        | 4.x     |
| UI Components   | Shadcn/ui (Radix UI)                | —       |
| ORM             | Prisma                              | 7.x     |
| Base de données | PostgreSQL (Neon)                   | —       |
| Auth            | Better Auth                         | 1.4.x   |
| Paiements       | Stripe (subscriptions)              | 20.x    |
| Formulaires     | @tanstack/react-form                | 1.28.x  |
| Tables          | @tanstack/react-table               | 8.x     |
| URL State       | nuqs                                | 2.8.x   |
| Server Actions  | next-safe-action                    | 8.x     |
| Validation      | Zod                                 | 4.x     |
| Emails          | Resend + @react-email/components    | —       |
| Env validation  | T3 Env (@t3-oss/env-nextjs)         | —       |
| Storage         | Cloudflare R2 (AWS S3 SDK) + Sharp  | —       |
| Rate limiting   | @upstash/ratelimit + @upstash/redis | —       |
| Monitoring      | @sentry/nextjs                      | —       |
| Package manager | pnpm                                | —       |
| Déploiement     | Vercel                              | —       |

### Dépendances UI (Shadcn/ui / Radix)

Les composants UI sont dans `components/ui/` et incluent : Button, Input, Textarea, Select, Dialog, Card, Badge, Avatar, Skeleton, Table, Tabs, Switch, Checkbox, Tooltip, Popover, DropdownMenu, etc. Ils sont tous basés sur Radix UI.

---

## 3. Structure du projet

```
ascender-saas-boilerplate/
├── app/
│   ├── (public)/                        # Pages publiques (SEO indexées)
│   │   ├── _components/                 # Composants partagés entre pages publiques
│   │   │   ├── modals/                  # Modals partagées
│   │   │   └── forms/                   # Formulaires partagés
│   │   ├── (auth)/                      # Pages auth (connexion, inscription, etc.)
│   │   │   ├── connexion/
│   │   │   ├── inscription/
│   │   │   └── mot-de-passe-oublie/
│   │   ├── (legal)/                     # Pages légales
│   │   │   ├── mentions-legales/
│   │   │   └── politique-de-confidentialite/
│   │   ├── contact/
│   │   │   ├── _actions/                # Server Actions spécifiques
│   │   │   ├── _components/
│   │   │   │   └── forms/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── tarifs/
│   │   └── verify-email/
│   ├── (protected)/                     # Pages protégées (non indexées)
│   │   ├── _actions/                    # Actions partagées dashboard + admin
│   │   │   ├── update-profile.action.ts
│   │   │   ├── update-password.action.ts
│   │   │   └── delete-account.action.ts
│   │   ├── _components/                 # Composants partagés protected
│   │   ├── dashboard/                   # Section utilisateur
│   │   │   ├── _components/
│   │   │   ├── parametres/              # Paramètres utilisateur
│   │   │   │   ├── _components/
│   │   │   │   │   ├── forms/
│   │   │   │   │   └── modals/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── facturation/             # Gestion abonnements Stripe
│   │   │   └── projets/
│   │   └── admin/                       # Section admin
│   │       ├── _components/
│   │       ├── parametres/
│   │       │   ├── _components/
│   │       │   │   ├── forms/
│   │       │   │   └── modals/
│   │       │   └── page.tsx
│   │       └── utilisateurs/            # Gestion utilisateurs (exemple complet filtres/tri)
│   │           ├── _lib/
│   │           │   └── get-users.ts     # Server-only data fetching
│   │           ├── _components/
│   │           │   ├── users-columns.tsx # Colonnes + SortableHeader
│   │           │   ├── users-filters.tsx # Formulaire de filtres
│   │           │   ├── users-table.tsx
│   │           │   └── modals/
│   │           ├── page.tsx
│   │           └── loading.tsx
│   ├── api/                             # API Routes
│   │   ├── auth/[...all]/               # Better Auth catch-all
│   │   ├── avatar/                      # Upload avatar (R2)
│   │   └── stripe/                      # Webhooks Stripe
│   ├── layout.tsx                       # Root layout
│   └── not-found.tsx
├── components/
│   ├── ui/                              # Shadcn/ui (DataTable, Field, etc.)
│   │   ├── data-table.tsx               # Rendu de table SANS tri/filtre client
│   │   ├── field.tsx                    # Field, FieldLabel, FieldError, etc.
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   └── ...                          # Autres composants Shadcn/ui
│   ├── emails/                          # Templates React Email
│   │   ├── contact-email.tsx
│   │   ├── reset-password-email.tsx
│   │   └── verify-email.tsx
│   └── pagination.tsx                   # Composant générique de pagination
├── lib/
│   ├── constants/
│   │   ├── query.constant.ts            # Limites globales (pagination, filtres, tri)
│   │   ├── users-filters.constant.ts    # Enums, labels, searchParams pour Users
│   │   └── user-role.constant.ts        # Constantes de rôles
│   ├── parsers/
│   │   └── nuqs.ts                      # Parsers universels réutilisables
│   ├── schemas/
│   │   ├── search/
│   │   │   └── users-filters.schema.ts  # Validation Zod des filtres
│   │   ├── contact.schema.ts
│   │   ├── profile.schema.ts
│   │   ├── password.schema.ts
│   │   └── account.schema.ts
│   ├── generated/prisma/               # Client Prisma généré
│   ├── auth.ts                         # Configuration Better Auth (server-only)
│   ├── auth-client.ts                  # Client-side auth helpers
│   ├── prisma.ts                       # Singleton Prisma
│   ├── env.ts                          # Validation T3 Env
│   ├── safe-action.ts                  # Clients next-safe-action
│   ├── session.ts                      # Helpers de session (server-only)
│   ├── resend.ts                       # Client Resend
│   ├── stripe.ts                       # Client Stripe
│   ├── r2.ts                           # Client Cloudflare R2
│   └── utils.ts                        # Utilitaire cn() pour Tailwind
├── utils/
│   ├── errors/
│   │   ├── errors.ts                   # Classes d'erreurs custom (AppError, etc.)
│   │   ├── handle-api-error.ts         # Handler pour API Routes
│   │   └── handle-action-error.ts      # Handler pour Server Actions
│   ├── string/                         # Utilitaires de manipulation de chaînes
│   ├── date/
│   │   └── format-date.ts
│   └── ratelimit/
├── prisma/
│   └── schema.prisma                   # Schéma de base de données
├── middleware.ts                        # Middleware Next.js (auth, i18n)
├── tailwind.config.ts
├── tsconfig.json                       # paths: { "@/*": ["./*"] }
└── package.json
```

### Règle de placement des composants ("Bubble Up")

| Utilisé dans...           | Placer dans...                    |
| ------------------------- | --------------------------------- |
| Une seule page            | `app/(group)/[page]/_components/` |
| Plusieurs pages publiques | `app/(public)/_components/`       |
| Plusieurs pages protégées | `app/(protected)/_components/`    |
| Dashboard ET Admin        | `app/(protected)/_components/`    |
| Public ET Protected       | `components/`                     |

### Sous-dossiers obligatoires

- **Modals** : TOUJOURS dans `_components/modals/`
- **Formulaires** : TOUJOURS dans `_components/forms/`
- **Autres composants** : dans `_components/` directement

---

## 4. Architecture en couches (Source of Truth)

C'est **LE pattern le plus important** du projet. Toutes les données descendent du haut vers le bas. Modifier une couche propage automatiquement les changements à toutes les couches en dessous.

```
Couche 1 : Sources externes
    Prisma Schema (enum UserRole: ADMIN, CUSTOMER)
    Stripe (statuts d'abonnement)
    R2 (limites de fichiers)
            ↓
Couche 2 : Constantes globales
    lib/constants/query.constant.ts
    → PAGINATION.maxPage = 1000
    → PAGINATION.defaultPageSize = 12
    → PAGINATION.pageSizes = [10, 12, 20, 25, 50, 100]
    → FILTERS.maxSearchLength = 100
    → FILTERS.maxArrayLength = 50
    → SORTING.orders = ["asc", "desc"]
    → SORTING.defaultOrder = "desc"
    → SORTING.defaultSortBy = "createdAt"
            ↓
Couche 3 : Parsers universels
    lib/parsers/nuqs.ts
    → parseAsPage (utilise PAGINATION.maxPage)
    → parseAsSafeSearch (utilise FILTERS.maxSearchLength, tronque avec .slice())
    → parseAsOrder
    → createEnumParser() (factory)
    → createSortByParser() (factory)
    NOTE : les parsers n'exportent PAS les constantes
            ↓
Couche 4 : Configuration domaine
    lib/constants/{entity}-filters.constant.ts
    → Enums définis ici (userRoleFilters, verificationFilters, etc.)
    → Labels pour l'UI (roleLabels, verificationLabels)
    → searchParams object (combine tous les parsers pour l'entité)
    → Type guards (isUserRole, isUserRoleFilter, etc.)
    → Types (UserRoleFilter, VerificationFilter, UserSortableField)
            ↓
Couche 5 : Schémas de validation
    lib/schemas/search/{entity}-filters.schema.ts
    → IMPORTE les enums depuis les constantes (ne les définit jamais)
    → Utilise FILTERS.maxSearchLength depuis query.constant.ts
    → Valide uniquement les champs du formulaire (pas sortBy/order/page)
            ↓
Couche 6 : Récupération serveur
    app/.../{entity}/_lib/get-{entity}.ts
    → import "server-only"
    → Re-valide TOUT côté serveur (defense in depth)
    → prisma.$transaction pour findMany + count en parallèle
    → orderBy dynamique : { [safeSortBy]: safeOrder }
    → TOUJOURS select + take sur findMany
            ↓
Couche 7 : Page serveur
    app/.../{entity}/page.tsx
    → createLoader(entitySearchParams) parse l'URL
    → Passe les filtres à getEntity()
    → Rend DataTable + Pagination
            ↓
Couche 8 : Composants client
    → Filters : TanStack Form + useQueryStates + Zod
    → SortableHeader : 3 états (asc → desc → reset)
    → DataTable : rendu pur (getCoreRowModel() uniquement)
    → Pagination : useQueryState pour le param page
```

**Principe clé** : Changer `PAGINATION.maxPage` de 1000 à 500 dans la couche 2 propage automatiquement le changement à TOUTES les couches en dessous sans toucher à aucun autre fichier.

---

## 5. Principes fondamentaux

### 5.1 Tolérance zéro bug

Le code doit être production-ready. Pas de TODO, pas de code commenté, pas de workarounds.

### 5.2 Logique binaire

Soit succès, soit throw. Pas de multiples returns dans un bloc try. Chaque étape de validation throw ou continue.

```typescript
// CORRECT : chaque étape throw ou continue
async function getDocument(id: string, userId: string) {
  if (!id) throw new BadRequestError("ID requis");

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!document) throw new NotFoundError("Document introuvable");
  if (document.userId !== userId)
    throw new ForbiddenError("Accès non autorisé");

  return document;
}

// INTERDIT : if/else avec multiples returns dans try
try {
  if (!response.ok) {
    toast.error("Erreur");
    return; // INTERDIT : return dans un try
  }
  toast.success("Succès");
} catch {}
```

### 5.3 Early return pattern

Gérer les cas limites d'abord, puis la logique principale. S'applique aux composants et fonctions synchrones.

```typescript
function UserProfile({ user }) {
  if (!user) return <UserProfileEmpty />;
  if (user.isBlocked) return <UserProfileBlocked />;

  return <article><h1>{user.name}</h1></article>;
}
```

### 5.4 Throw pattern dans try/catch

Pour les formulaires et opérations async, utiliser throw au lieu de return dans le bloc try.

```typescript
async function onSubmit(data) {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: data,
    });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.message || "Une erreur est survenue");
    }
    toast.success("Succès !");
  } catch (error: unknown) {
    toast.error(
      error instanceof Error ? error.message : "Une erreur est survenue"
    );
  }
}
```

### 5.5 Server-first

Les composants sont Server Components par défaut. `"use client"` uniquement pour : event handlers, hooks React, APIs du navigateur.

### 5.6 Protection server-only

Tout fichier contenant des fonctions exclusivement serveur DOIT commencer par `import "server-only"`. Cela inclut :

- Fonctions de requête base de données
- Helpers d'authentification (requireSession, requireAdmin)
- Utilitaires de data fetching
- Tout fichier avec accès direct à Prisma (hors API routes)

### 5.7 Type safety

Typage explicite partout. Aucun `any` implicite. Toujours typer les callbacks de `.map()`, `.filter()`, `.forEach()`, et les event handlers.

### 5.8 Exports nommés uniquement

JAMAIS de `export default` (sauf pour les pages Next.js qui l'exigent). Toujours `export { NomDuComposant }` en fin de fichier. Jamais d'export inline (`export function ...`).

### 5.9 Imports absolus

TOUJOURS utiliser `@/` comme préfixe. JAMAIS d'imports relatifs (`./` ou `../`).

### 5.10 Pas de commentaires dans le code

Le code doit être auto-documenté via des noms explicites. Pas de commentaires, pas de JSDoc, pas de docstrings (sauf si le code n'est vraiment pas auto-explicatif).

---

## 6. Conventions de nommage

### 6.1 Noms explicites (JAMAIS d'abréviations)

| Contexte         | CORRECT                       | INTERDIT                   |
| ---------------- | ----------------------------- | -------------------------- |
| Event handlers   | `event`                       | `e`, `evt`                 |
| Fetch response   | `response`                    | `res`, `r`                 |
| Response body    | `body`                        | `result`, `data`           |
| Résultat DB      | `document`, `user`, `project` | `doc`, `usr`, `proj`       |
| Index de tableau | `index`                       | `i`, `idx`, `_`            |
| Erreur           | `error`                       | `err`, `e`                 |
| Requête          | `request`                     | `req`                      |
| Configuration    | `config`                      | `cfg`                      |
| Paramètres       | `params`                      | `p`                        |
| Options          | `options`                     | `opts`                     |
| Référence        | `reference`                   | `ref` (sauf React refs)    |
| Propriétés       | `properties`                  | `props` (sauf React props) |
| Temporaire       | `temporary`                   | `temp`, `tmp`              |
| Précédent        | `previous`                    | `prev`                     |
| Courant          | `current`                     | `curr`                     |
| Bouton           | `button`                      | `btn`                      |
| Nombre           | `count`, `total`, `quantity`  | `num`, `n`                 |

### 6.2 Nommage des fichiers

- **Composants** : `kebab-case.tsx` (ex: `user-card.tsx`)
- **Schémas** : `{entity}.schema.ts` (ex: `document.schema.ts`)
- **Actions serveur** : `{verb}-{entity}.action.ts` (ex: `create-contact.action.ts`)
- **API Routes** : `route.ts` dans le dossier approprié
- **Constantes de filtres** : `{entity}-filters.constant.ts`
- **Schémas de filtres** : `{entity}-filters.schema.ts`
- **Data fetching** : `get-{entity}.ts`

### 6.3 Suffixes de composants

| Suffixe         | Usage                               | Emplacement           |
| --------------- | ----------------------------------- | --------------------- |
| `-card.tsx`     | Affiche UNE ressource               | `_components/`        |
| `-list.tsx`     | Itère sur des cards                 | `_components/`        |
| `-table.tsx`    | Table de données                    | `_components/`        |
| `-columns.tsx`  | Définitions de colonnes             | `_components/`        |
| `-row.tsx`      | Ligne de table                      | `_components/`        |
| `-form.tsx`     | Formulaire                          | `_components/forms/`  |
| `-modal.tsx`    | Dialog/Modal                        | `_components/modals/` |
| `-button.tsx`   | Bouton avec logique                 | `_components/`        |
| `-header.tsx`   | En-tête de section/page             | `_components/`        |
| `-tabs.tsx`     | Navigation par onglets              | `_components/`        |
| `-filters.tsx`  | Filtres (Nuqs)                      | `_components/`        |
| `-skeleton.tsx` | État de chargement                  | `_components/`        |
| `-empty.tsx`    | État vide (TOUJOURS fichier séparé) | `_components/`        |
| `-error.tsx`    | État d'erreur                       | `_components/`        |

### 6.4 Nommage des fonctions de pages

Les noms de fonctions de pages utilisent l'anglais en PascalCase + `Page`, même si l'URL est en français :

| Chemin URL (français)                            | Nom de fonction (anglais) |
| ------------------------------------------------ | ------------------------- |
| `app/(public)/tarifs/page.tsx`                   | `PricingPage`             |
| `app/(public)/(auth)/connexion/page.tsx`         | `SignInPage`              |
| `app/(protected)/dashboard/parametres/page.tsx`  | `DashboardSettingsPage`   |
| `app/(protected)/dashboard/facturation/page.tsx` | `DashboardBillingPage`    |
| `app/(protected)/admin/utilisateurs/page.tsx`    | `AdminUsersPage`          |

Même logique pour les loading : `AdminUsersLoading`, `DashboardSettingsLoading`, etc.

### 6.5 Nommage des Server Actions

- Pattern fichier : `{verb}-{entity}.action.ts`
- Pattern fonction : `{verb}{Entity}Action`
- Exemples : `createContactAction`, `updateProfileAction`, `deleteAccountAction`

---

## 7. Conventions de code

### 7.1 Imports

Toujours combiner les imports du même module. Utiliser `import type` pour les types seuls, `type` inline pour les imports mixtes.

```typescript
// CORRECT : types seuls
// CORRECT : mixte (types + valeurs)
import { type ChangeEvent, type SubmitEvent, useState } from "react";

import type { Metadata } from "next";
// INTERDIT : imports séparés du même module
import type { Metadata } from "next";
import { cookies } from "next";

import type { User } from "@/lib/generated/prisma/client";
import {
  CreateUserSchema,
  type CreateUserSchemaType,
} from "@/lib/schemas/user.schema";

// Devrait être combiné
```

### 7.2 Ordre des imports

1. React / Next.js
2. Bibliothèques externes (tanstack, lucide, nuqs, etc.)
3. Libs internes (`@/lib/...`)
4. Composants (`@/components/...`)
5. Composants locaux (`@/app/.../...`)
6. Utils (`@/utils/...`)

### 7.3 Typage des event handlers

TOUJOURS importer et utiliser les types d'événements React :

```typescript
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  SubmitEvent,
} from "react";

function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
  event.preventDefault();
}
function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
  /* ... */
}
function handleTextareaChange(event: ChangeEvent<HTMLTextAreaElement>) {
  /* ... */
}
function handleButtonClick(event: MouseEvent<HTMLButtonElement>) {
  /* ... */
}
function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  /* ... */
}
function handleDragOver(event: DragEvent<HTMLDivElement>) {
  /* ... */
}
```

### 7.4 Typage des callbacks de map/filter/forEach

TOUJOURS typer explicitement les paramètres :

```typescript
// CORRECT
{users.map((user: User) => <UserCard key={user.id} user={user} />)}
{items.map((item: Item, index: number) => <div key={index}>{item.name}</div>)}
users.forEach((user: User) => { console.log(user.name); });
const names = users.filter((user: User) => user.isActive).map((user: User) => user.name);

// INTERDIT
{users.map((user) => ...)}         // type implicite
{items.map((item, i) => ...)}      // "i" abrégé
{items.map((_, idx) => ...)}       // "idx" abrégé
```

### 7.5 Boutons

TOUJOURS ajouter `type="button"` sur les éléments `<button>`. Exception : `type="submit"` pour les boutons de soumission de formulaires.

### 7.6 Icônes et accessibilité

- Icônes décoratives (accompagnées de texte) : `aria-hidden="true"`
- Boutons icône-seulement (sans texte) : `aria-label="Description"`

```tsx
// Décorative : le texte donne le sens
<MapPin className="h-4 w-4" aria-hidden="true" />
<span>Paris, France</span>

// Fonctionnelle : aria-label donne le sens
<button type="button" aria-label="Fermer le modal">
  <X className="h-4 w-4" />
</button>
```

### 7.7 Classes CSS conditionnelles

TOUJOURS utiliser `cn()` de `@/lib/utils`. JAMAIS de concaténation de chaînes ou template literals.

```typescript
import { cn } from "@/lib/utils";

className={cn(
  "rounded-md px-4 py-2",
  variant === "primary" && "bg-blue-600 text-white",
  isDisabled && "cursor-not-allowed opacity-50",
  className
)}

// INTERDIT
className={`rounded-md ${variant === "primary" ? "bg-blue-600" : ""}`}
```

### 7.8 Utilitaire cn()

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { cn };
```

---

## 8. Composants

### 8.1 Structure d'un composant

```typescript
// 1. Directive "use client" (seulement si nécessaire)
"use client";

// 2. Imports
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 3. Type des props (si > 2 props)
type UserCardProps = {
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
};

// 4. Fonction du composant
function UserCard({ name, email, avatarUrl, role }: UserCardProps) {
  if (!name) {
    return <UserCardEmpty />;
  }

  return (
    <article>
      <img src={avatarUrl} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </article>
  );
}

// 5. Export nommé (JAMAIS default)
export { UserCard };
```

### 8.2 Props

- **2 props ou moins** : type inline dans la signature
- **Plus de 2 props** : type séparé `{ComponentName}Props`
- TOUJOURS `type` (jamais `interface`)

```typescript
// Inline (≤ 2 props)
function UserAvatar({ src, alt }: { src: string; alt: string }) { ... }

// Séparé (> 2 props)
type UserCardProps = { name: string; email: string; avatarUrl: string; };
function UserCard({ name, email, avatarUrl }: UserCardProps) { ... }
```

### 8.3 Server vs Client Components

- **Server Components** par défaut (pas de directive)
- `"use client"` UNIQUEMENT pour : event handlers, hooks React (`useState`, `useEffect`, etc.), APIs navigateur (`window`, `document`)

### 8.4 DataTable (Rendu pur)

Le composant `DataTable` est un **rendu pur** qui n'utilise QUE `getCoreRowModel()`. Il ne fait AUCUN tri, filtre ou pagination côté client. Tout est géré côté serveur via les URL params.

```typescript
// components/ui/data-table.tsx
function DataTable({ columns, data, emptyMessage }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // PAS de getSortedRowModel
    // PAS de getFilteredRowModel
    // PAS de getPaginationRowModel
  });
  // ... rendu du tableau
}
```

---

## 9. Pages

### 9.1 Page publique

```typescript
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";
import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "Description ici";

export const metadata: Metadata = {
  title: `${APP_NAME} - Tagline`,
  description: DESCRIPTION,
  keywords: [APP_NAME.toLowerCase(), "keyword1", "keyword2"],
  alternates: { canonical: "/path" },
  openGraph: { title: `${APP_NAME} - Tagline`, description: DESCRIPTION, url: "/path" },
  twitter: { title: `${APP_NAME} - Tagline`, description: DESCRIPTION },
};

export default function ExamplePage() {
  const pageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/path/#webpage`,
    name: `${APP_NAME} - Tagline`,
    url: `${BASE_URL}/path`,
    description: DESCRIPTION,
    inLanguage: "fr-FR",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <main>{/* contenu */}</main>
    </>
  );
}
```

### 9.2 Page protégée (Dashboard)

```typescript
import type { Metadata } from "next";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Titre de la page",
  robots: { index: false, follow: false },
};

export default async function DashboardSettingsPage() {
  await requireSession();
  return <main>{/* contenu */}</main>;
}
```

### 9.3 Page admin

```typescript
import type { Metadata } from "next";
import { requireAdminVerifiedEmail } from "@/lib/session";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  await requireAdminVerifiedEmail();
  // ... data fetching et rendu
  return <main>{/* contenu */}</main>;
}
```

### Règles clés des pages

- Élément top-level : TOUJOURS `<main>`
- Pages publiques : metadata complète + JSON-LD
- Pages protégées : SEULEMENT `title` + `robots: { index: false, follow: false }` + PAS de JSON-LD
- Dashboard → `requireSession()`
- Admin → `requireAdmin()` ou `requireAdminVerifiedEmail()`

---

## 10. Loading Pages

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la liste des utilisateurs"
      className="flex min-h-screen flex-col gap-6 p-6"
    >
      {Array.from({ length: 8 }).map((_, index: number) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </main>
  );
}
```

### Règles clés

- Nom : `{EnglishPath}Loading` (ex: `AdminUsersLoading`)
- `export default` (exigé par Next.js)
- Élément top-level : `<main>` avec `aria-busy="true"` et `aria-label`
- Utiliser `Skeleton` de Shadcn/ui
- JAMAIS async, JAMAIS de data fetching, JAMAIS de metadata
- Le squelette doit refléter la structure réelle de la page

---

## 11. Formulaires (TanStack Form)

### 11.1 Librairie

Le projet utilise **`@tanstack/react-form`** (PAS react-hook-form). Les composants de champ viennent de `@/components/ui/field` (PAS de `@/components/ui/form` qui serait react-hook-form).

### 11.2 Structure complète d'un formulaire

```typescript
"use client";

import type { ChangeEvent, SubmitEvent } from "react";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { CreateContactSchema, type CreateContactSchemaType } from "@/lib/schemas/contact.schema";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { createContactAction } from "@/app/(public)/contact/_actions/create-contact.action";

function ContactForm() {
  const { executeAsync, isExecuting } = useAction(createContactAction);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    } as CreateContactSchemaType,           // Type assertion obligatoire
    validators: {
      onSubmit: CreateContactSchema,         // Schéma Zod importé
    },
    onSubmit: async ({ value }) => {
      const result = await executeAsync(value);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        toast.success("Message envoyé avec succès !");
        form.reset();                        // Reset après succès
      }
    },
  });

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
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
    </form>
  );
}

export { ContactForm };
```

### 11.3 Pattern de champ (isInvalid)

Chaque champ suit exactement ce pattern :

1. `isInvalid = field.state.meta.isTouched && !field.state.meta.isValid`
2. `<Field data-invalid={isInvalid}>`
3. `<FieldLabel htmlFor="unique-id">`
4. `<Input aria-invalid={isInvalid} />`
5. `{isInvalid && <FieldError errors={field.state.meta.errors} />}`

### 11.4 Deux patterns de soumission

**Pattern A : Server Actions (préféré)**

- `useAction` de `next-safe-action/hooks`
- `executeAsync(value)` dans `onSubmit`
- Pas de try/catch nécessaire

**Pattern B : API Routes (pour uploads de fichiers)**

- `fetch` avec `FormData`
- Early return sur erreur
- `router.refresh()` après succès

### 11.5 Inputs fichier

Les inputs fichier DOIVENT TOUJOURS inclure le drag & drop avec :

- `onDragOver`, `onDragLeave`, `onDrop`
- Prévisualisation du fichier sélectionné
- Bouton de suppression du fichier
- Affichage de la taille et du type

### 11.6 Séparation Form/Modal

Les formulaires et modals sont TOUJOURS dans des fichiers séparés :

- Formulaire : `_components/forms/delete-account-form.tsx`
- Modal : `_components/modals/delete-account-modal.tsx`

La modal importe et rend le formulaire. Le formulaire reçoit un prop `onSuccess` pour fermer la modal.

---

## 12. Schémas Zod

### 12.1 Emplacement

`lib/schemas/{entity}.schema.ts` — Un fichier par entité.

### 12.2 Structure et ordre

```typescript
import { z } from "zod";

// 1. Constantes internes (NON exportées)
const MAX_FILE_SIZE = 10485760;

// 2. Schémas dans l'ordre HTTP : Read → Create → Replace → Update → Delete
const CreateDocumentSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(), // TOUJOURS .min() → .max() → .trim()
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

// 3. Types inférés (même ordre que les schémas)
type CreateDocumentSchemaType = z.infer<typeof CreateDocumentSchema>;
type UpdateDocumentSchemaType = z.infer<typeof UpdateDocumentSchema>;

// 4. Export des schémas (même ordre)
export { CreateDocumentSchema, UpdateDocumentSchema };

// 5. Export des types (même ordre)
export type { CreateDocumentSchemaType, UpdateDocumentSchemaType };
```

### Règles clés

- String : `.min()` → `.max()` → `.trim()` (dans cet ordre exact)
- Number : `.min()` → `.max()` avec messages en français
- Messages d'erreur TOUJOURS en français
- Constantes internes non exportées
- Types nommés `{SchemaName}Type`

---

## 13. Routes API

### 13.1 Structure

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDocumentSchema } from "@/lib/schemas/document.schema";

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";

type RouteParams = {
  params: Promise<{ id: string }>; // TOUJOURS Promise
};

// Fonctions dans l'ordre HTTP : GET → POST → PUT → PATCH → DELETE

async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params; // TOUJOURS await params
    if (!id) throw new BadRequestError("ID requis");

    const authSession = await auth.api.getSession({ headers: await headers() });
    if (!authSession?.user)
      throw new UnauthorizedError("Vous devez être connecté");

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, name: true, userId: true }, // TOUJOURS select
    });
    if (!document) throw new NotFoundError("Document introuvable");
    if (document.userId !== authSession.user.id)
      throw new ForbiddenError("Accès non autorisé");

    return NextResponse.json(
      { success: true, data: document },
      { status: 200 }
    );
  } catch (error: unknown) {
    // TOUJOURS error: unknown
    return handleApiError(error);
  }
}

async function POST(request: Request) {
  try {
    const authSession = await auth.api.getSession({ headers: await headers() });
    if (!authSession?.user)
      throw new UnauthorizedError("Vous devez être connecté");

    const formData = await request.formData(); // TOUJOURS formData(), JAMAIS .json()

    const data = CreateDocumentSchema.parse({
      name: formData.get("name"),
    });

    const document = await prisma.document.create({
      data: { ...data, userId: authSession.user.id },
      select: { id: true, name: true },
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // ... validation, auth, ownership check ...
    await prisma.document.delete({ where: { id } });
    return new NextResponse(null, { status: 204 }); // DELETE = 204, pas de body
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// Export dans l'ordre HTTP
export { GET, POST, DELETE };
```

### Codes de statut HTTP

| Méthode   | Succès                    | Code              |
| --------- | ------------------------- | ----------------- |
| GET       | Ressource(s) récupérée(s) | 200               |
| POST      | Ressource créée           | 201               |
| PUT/PATCH | Ressource mise à jour     | 200               |
| DELETE    | Ressource supprimée       | 204 (pas de body) |

### Règles clés

- TOUJOURS `request.formData()` (JAMAIS `request.json()`)
- TOUJOURS `await params` (les params sont une Promise dans Next.js 16)
- TOUJOURS `select` dans Prisma
- TOUJOURS `error: unknown` dans catch
- Pattern binaire : throw ou continue, jamais multiple returns dans try
- Export en fin de fichier, dans l'ordre HTTP

---

## 14. Server Actions (next-safe-action)

### 14.1 Structure

```typescript
"use server"; // DOIT être la première ligne
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { authActionClient } from "@/lib/safe-action";
import { UpdateProfileSchema } from "@/lib/schemas/profile.schema";

import { ConflictError } from "@/utils/errors/errors";

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema) // Validation automatique via Zod
  .action(async ({ parsedInput, ctx }) => {
    // parsedInput est typé et validé automatiquement
    // ctx contient userId, userEmail, userName (fourni par authActionClient)

    const existing = await prisma.user.findUnique({
      where: { email: parsedInput.email },
      select: { id: true },
    });

    if (existing && existing.id !== ctx.userId) {
      throw new ConflictError("Cette adresse email est déjà utilisée");
    }

    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,
      select: { id: true, name: true, email: true },
    });

    revalidatePath("/dashboard/parametres");

    return { success: true, user };
  });
```

### 14.2 Trois clients disponibles

| Client              | Usage                            | Contexte fourni                              |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `actionClient`      | Actions publiques (pas d'auth)   | Aucun                                        |
| `authActionClient`  | Actions protégées (auth requise) | `userId`, `userEmail`, `userName`            |
| `adminActionClient` | Actions admin uniquement         | `userId`, `userEmail`, `userName`, `isAdmin` |

### 14.3 Règles clés

- `"use server"` DOIT être la première ligne
- PAS de try/catch (géré automatiquement par next-safe-action)
- Throw les erreurs directement (ConflictError, NotFoundError, etc.)
- TOUJOURS utiliser `.inputSchema()` (jamais `.parse()` manuel)
- Retourner des objets simples (pas de NextResponse)
- Côté client : `useAction` de `next-safe-action/hooks` + `executeAsync`

### 14.4 Emplacement des fichiers

| Scope                  | Emplacement                    |
| ---------------------- | ------------------------------ |
| Spécifique à une page  | `app/(group)/[page]/_actions/` |
| Partagé entre sections | `app/(group)/_actions/`        |
| Global (rare)          | `lib/actions/`                 |

---

## 15. Filtres, Tri & Pagination (Nuqs)

### 15.1 Vue d'ensemble

Tout le système de filtres/tri/pagination est **URL-based** et **côté serveur**. Les composants client ne font que lire/écrire dans l'URL, et le serveur refait le rendu avec les nouveaux paramètres.

### 15.2 Options Nuqs obligatoires

```typescript
const [filters, setFilters] = useQueryStates(searchParams, {
  shallow: false, // Le serveur re-fetch les données
  history: "push", // Le bouton retour fonctionne
  startTransition, // Affiche un état de chargement
});
```

### 15.3 Tri 3 états (SortableHeader)

Le tri suit un cycle à 3 états : `non trié → asc → desc → reset`

```typescript
function handleSort() {
  // Si actif et en desc → reset (supprimer le tri)
  if (isActive && filters.order === "desc") {
    setFilters({ sortBy: null, order: null, page: 1 });
    return;
  }
  // Sinon → asc ou desc
  setFilters({
    sortBy: field,
    order: isActive && filters.order === "asc" ? "desc" : "asc",
    page: 1,
  });
}
```

### 15.4 Règles clés des filtres

- `null` pour supprimer un paramètre de l'URL (pas de chaîne vide)
- TOUJOURS reset `page: 1` quand les filtres changent
- `useTransition` pour le feedback de chargement
- Le formulaire de filtres utilise TanStack Form + Zod pour la validation locale
- `onSubmit` du formulaire synchronise avec l'URL via `setUrlFilters`
- `handleClearFilters` réinitialise le formulaire ET l'URL

### 15.5 Sécurité (Defense in Depth)

Chaque couche valide indépendamment :

| Couche            | Protection                                |
| ----------------- | ----------------------------------------- |
| Parser nuqs       | Bornes, longueur, enum                    |
| Schéma Zod        | Validation de formulaire                  |
| Server data fetch | Re-validation de TOUS les paramètres      |
| Prisma            | Requêtes paramétrées (anti-SQL injection) |
| React             | Échappement automatique (anti-XSS)        |

---

## 16. Authentification & Autorisation

### 16.1 Better Auth

Le projet utilise **Better Auth** avec :

- Email/password avec vérification d'email obligatoire
- OAuth Google
- Sessions avec cookie cache (5 min)
- Rate limiting intégré
- Rôles utilisateur : `ADMIN` et `CUSTOMER`

### 16.2 Helpers de session (server-only)

```typescript
// lib/session.ts
import "server-only";

// Requiert une session (redirige vers /connexion sinon)
const requireSession = async (): Promise<Session> => { ... };

// Requiert un rôle admin (404 sinon)
const requireAdmin = async (): Promise<Session> => { ... };

// Requiert admin + email vérifié
const requireAdminVerifiedEmail = async (): Promise<Session> => { ... };
```

### 16.3 Clients safe-action

```typescript
// lib/safe-action.ts
// actionClient : pas d'auth
// authActionClient : vérifie la session, fournit userId/userEmail/userName
// adminActionClient : vérifie la session + rôle admin
```

### 16.4 Auth côté client

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({ ... });
```

---

## 17. Gestion des erreurs

### 17.1 Classes d'erreurs

```typescript
// utils/errors/errors.ts
class AppError extends Error {
  readonly statusCode: number;
}

class BadRequestError extends AppError {
  statusCode = 400;
}
class UnauthorizedError extends AppError {
  statusCode = 401;
}
class ForbiddenError extends AppError {
  statusCode = 403;
}
class NotFoundError extends AppError {
  statusCode = 404;
}
class ConflictError extends AppError {
  statusCode = 409;
}
class PayloadTooLargeError extends AppError {
  statusCode = 413;
}
class UnprocessableEntityError extends AppError {
  statusCode = 422;
}
class TooManyRequestsError extends AppError {
  statusCode = 429;
}
```

### 17.2 Usage

| Classe                     | Usage                                 |
| -------------------------- | ------------------------------------- |
| `BadRequestError`          | Input invalide, param manquant        |
| `UnauthorizedError`        | Pas de session                        |
| `ForbiddenError`           | Authentifié mais pas autorisé         |
| `NotFoundError`            | Ressource introuvable                 |
| `ConflictError`            | Doublon, conflit d'état               |
| `PayloadTooLargeError`     | Fichier trop gros                     |
| `UnprocessableEntityError` | Syntaxe valide mais erreur sémantique |
| `TooManyRequestsError`     | Rate limit dépassé                    |

### 17.3 Handlers

- **API Routes** : `handleApiError(error)` dans le catch → retourne `NextResponse` avec le bon status code
- **Server Actions** : `handleServerError` configuré dans safe-action → retourne le message d'erreur au client via `result.serverError`
- Les erreurs Zod sont automatiquement gérées (status 400 avec le premier message d'erreur)

---

## 18. Prisma (Base de données)

### 18.1 Schéma principal

```prisma
model User {
  id             String    @id
  name           String
  email          String    @unique
  emailVerified  Boolean   @default(false)
  image          String?
  role           UserRole  @default(CUSTOMER)
  slug           String    @unique
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  banned         Boolean?
  banReason      String?
  banExpires     DateTime?
  // Relations : sessions, accounts, stripeCustomer, subscription
}

enum UserRole {
  ADMIN
  CUSTOMER
}

model StripeCustomer { ... }
model Subscription {
  status SubscriptionStatus  // active, trialing, past_due, canceled, etc.
  // ... intégration Stripe complète
}

model Session { ... }
model Account { ... }  // OAuth providers
model Verification { ... }  // Email verification tokens
```

### 18.2 Règles Prisma

1. **TOUJOURS `select`** pour spécifier les champs retournés (jamais retourner l'objet complet)
2. **TOUJOURS `take`** sur `findMany` (chaque requête est paginée en interne)
3. **`$transaction`** pour count + findMany en parallèle
4. **`Promise.all`** pour requêtes indépendantes en parallèle
5. **Noms complets** pour les résultats (pas `doc`, `usr`, etc.)

```typescript
// CORRECT
const [users, totalCount] = await prisma.$transaction([
  prisma.user.findMany({
    where: whereClause,
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  }),
  prisma.user.count({ where: whereClause }),
]);

// INTERDIT : findMany sans select ou sans take
const users = await prisma.user.findMany({ where: whereClause });
```

### 18.3 Client Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
```

---

## 19. Traitement des chaînes de caractères

### 19.1 Ordre universel de traitement

```
1. VALIDATION    → Early return si invalide
2. SANITISATION  → Supprimer le contenu dangereux
3. NORMALISATION → Standardiser (trim, normalize, etc.)
4. TRANSFORMATION → Split, replace, etc.
5. FILTRAGE      → Supprimer les éléments indésirables
6. MAPPING       → Transformer chaque élément
7. AGRÉGATION    → Reduce, join, etc.
8. FORMATAGE     → Case, padding, etc.
9. LIMITATION    → Slice, truncate, etc.
```

### 19.2 Règles clés

- TOUJOURS valider avant de traiter (`if (!input || typeof input !== "string") return ""`)
- `split → filter → map` (jamais map avant filter)
- `join` avant `format` (1 appel au lieu de N)
- `format` avant `limit` (`.toUpperCase()` puis `.slice()`)
- `.charAt(index)` au lieu de `[index]` (plus sûr)
- TOUJOURS typer les callbacks : `.map((word: string) => ...)`
- Utiliser des constantes pour les limites (pas de magic numbers)
- `.slice()` pour tronquer (pas rejeter)

---

## 20. Anti-Patterns (Ce qu'il ne faut JAMAIS faire)

### Nommage

```typescript
// INTERDIT : abréviations
(e, evt, res, req, doc, usr, btn, cfg, opts, prev, curr, temp, idx, i);
```

### Imports

```typescript
// INTERDIT : imports séparés du même module
import type { Type } from "module";
import { value } from "module";

// CORRECT : import { value, type Type } from "module";
```

### Exports

```typescript
// INTERDIT
export default function Component() { ... }   // Pas de default export
export function Component() { ... }            // Pas d'export inline
```

### Composants

```typescript
// INTERDIT : "use client" sans nécessité
"use client";
function StaticText({ text }: { text: string }) {
  return <p>{text}</p>;
}

// INTERDIT : état vide inline (doit être dans un fichier séparé -empty.tsx)
function JobList({ jobs }) {
  if (jobs.length === 0) return <div>Aucune offre</div>;
}

// INTERDIT : form et modal dans le même fichier
function DeleteModal() {
  const form = useForm({ ... });
  return <Dialog><form>...</form></Dialog>;
}
```

### Formulaires

```typescript
// INTERDIT : react-hook-form (utiliser @tanstack/react-form)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";

// INTERDIT : early return dans try/catch
try {
  if (!response.ok) { toast.error("Erreur"); return; }  // Utiliser throw
}

// INTERDIT : input fichier sans drag & drop
<input type="file" onChange={handleChange} />
```

### API Routes

```typescript
// INTERDIT : request.json()
const data = await request.json();
// CORRECT : request.formData()

// INTERDIT : multiple returns dans try
try {
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// CORRECT : throw new UnauthorizedError("...")

// INTERDIT : Prisma sans select
const user = await prisma.user.findUnique({ where: { id } });
```

### DataTable

```typescript
// INTERDIT : tri/filtre/pagination côté client
useReactTable({
  getSortedRowModel: getSortedRowModel(), // INTERDIT
  getFilteredRowModel: getFilteredRowModel(), // INTERDIT
  getPaginationRowModel: getPaginationRowModel(), // INTERDIT
});
```

### Nuqs

```typescript
// INTERDIT
shallow: true          // Le serveur ne re-fetch pas
history: "replace"     // Casse le bouton retour
setFilters({ search: "" })  // Utiliser null, pas ""
setFilters({ role: value }) // Manque page: 1

// INTERDIT : parsers qui rejettent au lieu de tronquer
parse(query) {
  if (query.length > MAX) return "";  // Doit tronquer avec .slice()
}
```

### Server Actions

```typescript
// INTERDIT : try/catch dans une action (géré par next-safe-action)
export const myAction = authActionClient
  .action(async ({ parsedInput }) => {
    try { ... } catch { ... }  // PAS NÉCESSAIRE
  });

// INTERDIT : "use server" pas en première ligne
import { ... } from "...";
"use server";  // DOIT être ligne 1
```

### Schémas Zod

```typescript
// INTERDIT : trim avant max
name: z.string().min(1).trim().max(200);
// CORRECT : .min() → .max() → .trim()

// INTERDIT : pas de messages d'erreur
name: z.string().min(1).max(200).trim();
// CORRECT : .min(1, "Le nom est requis").max(200, "...").trim()

// INTERDIT : exporter les constantes internes
export const MAX_FILE_SIZE = 10485760;
```

---

## Résumé des principes architecturaux

1. **Source of Truth en cascade** : Prisma → Constants → Parsers → Domain Config → Schema → Server Fetch → Page → Client Components
2. **Server-side everything** : Le DataTable est un rendu pur, tout le tri/filtre/pagination est côté serveur
3. **Defense in depth** : Validation à CHAQUE couche (parser, schéma, serveur, Prisma)
4. **Logique binaire** : Soit succès, soit throw — jamais de multiples returns
5. **TanStack Form** : Jamais react-hook-form, toujours `@tanstack/react-form` + `@/components/ui/field`
6. **next-safe-action** : Jamais de try/catch dans les actions, jamais de validation manuelle
7. **Nuqs URL-based** : `shallow: false`, `history: "push"`, `startTransition`, `null` pour effacer
8. **Nommage explicite** : Jamais d'abréviations, typage explicite des callbacks
9. **Séparation stricte** : Form ≠ Modal, état vide = fichier séparé, 1 composant = 1 fichier
10. **Français pour l'utilisateur, anglais pour le code** : Messages d'erreur Zod en français, noms de fonctions en anglais
