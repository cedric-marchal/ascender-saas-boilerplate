# Audit de Sécurité — Système de Filtres

**Date**: 2026-02-19
**Périmètre**: Architecture de filtrage URL-based (nuqs + Prisma)
**Statut**: ⚠️ Failles critiques identifiées

---

## Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture Actuelle](#architecture-actuelle)
- [Mécanismes de Sécurité Existants](#mécanismes-de-sécurité-existants)
- [Failles Identifiées](#failles-identifiées)
  - [🔴 Critique: Rate Limiting Manquant](#-critique-rate-limiting-manquant)
  - [🔴 Critique: IDOR](#-critique-idor-insecure-direct-object-reference)
  - [⚠️ Pattern Anti-Booléen](#️-pattern-anti-booléen-p0)
  - [🟠 Majeur: Information Disclosure](#-majeur-information-disclosure-via-count)
  - [🟠 Majeur: Mass Assignment](#-majeur-mass-assignment-dans-actions)
  - [🟡 Moyen: Parameter Pollution](#-moyen-parameter-pollution)
  - [🟡 Moyen: Unicode Normalization](#-moyen-unicode-normalization)
  - [🟡 Moyen: Cache Poisoning](#-moyen-cache-poisoning)
  - [🟡 Moyen: Timing Attacks](#-moyen-timing-attacks)
  - [🟡 Moyen: Business Logic Flaw](#-moyen-business-logic-flaw)
- [Checklist de Sécurité](#checklist-de-sécurité)
- [Plan d'Action](#plan-daction)
- [Tableau de Synthèse](#tableau-de-synthèse)

---

## Vue d'ensemble

Le système de filtres actuel implémente une **défense en profondeur** avec validation à 6 couches :

```
Parsers → Constants → Schemas → Services → Prisma → React
```

**Points forts** :
- ✅ Validation multi-niveaux (parsers, Zod, serveur)
- ✅ Whitelists strictes (enums, sortBy, select)
- ✅ Requêtes paramétrées (Prisma ORM)
- ✅ Truncation automatique (pas de rejet = pas de DoS)
- ✅ Type-safety (TypeScript + Zod)

**Points faibles** :
- ❌ Absence de rate limiting
- ❌ Vérifications d'autorisation incomplètes (IDOR)
- ❌ Fuites d'information via `totalCount`
- ❌ Risques de mass assignment dans les actions

---

## Architecture Actuelle

### Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│ URL: ?search=test&page=1&role=ADMIN                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: lib/parsers/nuqs.ts                                │
│ → Truncate search (100 chars), clamp page (1-1000)          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: features/*/constants/*-filters.constant.ts         │
│ → Validate enum (role whitelist)                            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: features/*/schemas/*-filters.schema.ts             │
│ → Zod validation (client-side form)                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: features/*/services/get-*.service.ts               │
│ → Re-validate ALL params, Prisma parameterized queries      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: app/*/page.tsx                                     │
│ → createLoader(searchParams) auto-parsing                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: Components (filters, columns, pagination)          │
│ → Display data, URL mutation via useQueryStates             │
└─────────────────────────────────────────────────────────────┘
```

---

## Mécanismes de Sécurité Existants

| Protection | Implémentation | Efficacité |
|------------|----------------|------------|
| **SQL Injection** | Prisma requêtes paramétrées + whitelist `sortBy` | ✅ Excellente |
| **XSS** | React auto-escape + truncation parsers | ✅ Excellente |
| **Enum Injection** | `parseAsStringLiteral` + Zod `z.enum()` | ✅ Excellente |
| **Negative Page** | `Math.max(1, ...)` dans parser | ✅ Excellente |
| **Huge Page** | `Math.min(..., MAX_PAGE)` dans parser | ✅ Excellente |
| **Long Search** | `.slice(0, MAX_SEARCH_LENGTH)` | ✅ Bonne |
| **DoS (Rows)** | `take: DEFAULT_PAGE_SIZE` (10/20/50/100) | ✅ Bonne |
| **Order By Injection** | Whitelist `sortableFields` | ✅ Excellente |
| **Select * Exposure** | `select: { ... }` explicite | ✅ Excellente |

---

## Failles Identifiées

### 🔴 Critique: Rate Limiting Manquant

#### Problème

Aucune limite sur les requêtes de filtrage. Un attaquant peut spammer la DB.

**Vecteur d'attaque** :
```bash
# Script automatisé - 1000 requêtes/seconde
for i in {1..100000}; do
  curl "https://app.com/admin/users?search=a&page=$i" &
done
```

**Impact** :
- 🔴 **DoS** : Saturation CPU/DB
- 🔴 **Énumération** : Découverte de tous les utilisateurs
- 🔴 **Coût** : Explosion facture serverless (Vercel/Neon)

#### Solution

**Fichier** : `lib/ratelimit.ts`

```tsx
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

export const filterRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requêtes/minute
  analytics: true,
  prefix: "@upstash/ratelimit:filter",
});
```

**Fichier** : `features/users/services/get-users.service.ts`

```tsx
import "server-only";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { filterRatelimit } from "@/lib/ratelimit";

async function getUsers(filters: GetUsersFilters, userId: string) {
  // ✅ Rate limit: 100 requêtes/minute par utilisateur
  await checkRatelimit(filterRatelimit, userId);

  // ... reste du code
}
```

**Priorité** : 🔴 **P0 — À implémenter immédiatement**

---

### 🔴 Critique: IDOR (Insecure Direct Object Reference)

#### Problème

Les services ne vérifient **jamais** que l'utilisateur a le droit d'accéder aux données filtrées.

**Vecteur d'attaque** :

```tsx
// ❌ CODE ACTUEL VULNÉRABLE
async function getDocuments(filters: GetDocumentsFilters) {
  const [documents, totalCount] = await prisma.$transaction([
    prisma.document.findMany({
      where: {
        name: { contains: filters.search },
        // ❌ PAS DE: userId: currentUserId
      },
      select: { id: true, name: true, content: true },
    }),
    prisma.document.count(),
  ]);

  return { documents, totalCount };
}
```

**Exploitation** :
```
Utilisateur A (ID: user-123) peut voir TOUS les documents de TOUS les utilisateurs
→ Accès non autorisé à données sensibles
```

#### Solution

```tsx
// ✅ CORRECTION: Utiliser UserRole au lieu de booléens
import "server-only";
import { UserRole } from "@/lib/constants/roles.constant";

// Définir quels rôles peuvent accéder à TOUTES les données
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];

async function getDocuments(
  filters: GetDocumentsFilters,
  userId: string,     // ← OBLIGATOIRE: ID de l'utilisateur connecté
  userRole: UserRole  // ← OBLIGATOIRE: Rôle de l'utilisateur connecté
): Promise<GetDocumentsResult> {
  // Vérifier si l'utilisateur a un rôle non restreint
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);

  const whereClause = {
    // ✅ Filtrer par userId SAUF pour les rôles autorisés (ADMIN, etc.)
    ...(!canAccessAllData && { userId }),
    ...(filters.search && {
      name: { contains: filters.search, mode: "insensitive" as const },
    }),
  };

  const [documents, totalCount] = await prisma.$transaction([
    prisma.document.findMany({
      where: whereClause,  // ✅ userId forcé sauf pour ADMIN
      select: { id: true, name: true, content: true },
    }),
    prisma.document.count({ where: whereClause }),
  ]);

  return { documents, totalCount };
}

// Usage dans la page
const session = await requireSession();
const { documents } = await getDocuments(filters, session.user.id, session.user.role);
```

**Règles** :
1. **TOUS** les services doivent recevoir `userId: string` ET `userRole: UserRole`
2. **Définir** `UNRESTRICTED_ROLES` au début du service pour lister les rôles autorisés
3. **Filtrer** par `userId` par défaut, sauf si `userRole` est dans `UNRESTRICTED_ROLES`
4. **JAMAIS** de booléens `isAdmin`, toujours utiliser `UserRole` depuis `@/lib/constants/roles.constant`

**Avantages** :
- ✅ Type-safe avec TypeScript
- ✅ Extensible : ajout facile de nouveaux rôles (MANAGER, MODERATOR, etc.)
- ✅ Single source of truth : rôles définis dans Prisma
- ✅ Évite les booléens qui deviennent ingérables avec plusieurs rôles

**Priorité** : 🔴 **P0 — À implémenter immédiatement**

---

### ⚠️ Pattern Anti-Booléen (P0)

#### Règle Stricte : JAMAIS de booléens pour les permissions

**❌ INTERDIT** :
```tsx
async function getEntity(
  filters: GetEntityFilters,
  userId: string,
  isAdmin: boolean = false  // ❌ Booléen = Non maintenable
) {
  const whereClause = {
    ...(!isAdmin && { userId }),
  };
}
```

**Problèmes avec les booléens** :
- ❌ Non extensible : Que faire avec un 3e rôle (MANAGER, MODERATOR) ?
- ❌ Logique ternaire : `if (!isAdmin)` devient confus avec plusieurs rôles
- ❌ Non type-safe : `isAdmin: boolean` accepte n'importe quel booléen
- ❌ Duplication : Chaque service réinvente la roue

**✅ OBLIGATOIRE : Utiliser `UserRole`**

```tsx
import "server-only";
import { UserRole } from "@/lib/constants/roles.constant";

// 1. Définir explicitement quels rôles ont quels accès
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];
// Futurs rôles : [UserRole.ADMIN, UserRole.MANAGER, UserRole.MODERATOR]

async function getEntity(
  filters: GetEntityFilters,
  userId: string,
  userRole: UserRole  // ✅ Type-safe, extensible
): Promise<GetEntityResult> {
  // 2. Logique claire et maintenable
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);

  const whereClause = {
    ...(!canAccessAllData && { userId }),
    // ...
  };
}
```

**Avantages** :
- ✅ **Extensibilité** : Ajout de nouveaux rôles en 1 ligne
- ✅ **Type-safety** : TypeScript force `UserRole` (pas `string`)
- ✅ **Maintenabilité** : Logique centralisée dans `UNRESTRICTED_ROLES`
- ✅ **Auditabilité** : Facile de voir quels rôles ont quels droits
- ✅ **Single Source of Truth** : Rôles définis dans Prisma schema

**Cas d'usage multiples** :

```tsx
// Différents niveaux d'accès selon le contexte
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];
const EXACT_COUNT_ROLES: UserRole[] = [UserRole.ADMIN];
const UNRESTRICTED_FILTER_ROLES: UserRole[] = [UserRole.ADMIN];
const EXPORT_ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];

async function getEntity(
  filters: GetEntityFilters,
  userId: string,
  userRole: UserRole
) {
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const canCombineFilters = UNRESTRICTED_FILTER_ROLES.includes(userRole);
  const canExport = EXPORT_ALLOWED_ROLES.includes(userRole);

  // Logique claire pour chaque permission
  if (!canAccessAllData) { /* filtrer par userId */ }
  if (!canCombineFilters) { /* interdire combinaisons */ }
  if (!canExport) { /* bloquer export */ }
}
```

**À appliquer dans** :
- ✅ TOUS les services `get-*.service.ts`
- ✅ TOUS les utilitaires (`getFuzzyCount`, `constantTimeDelay`, etc.)
- ✅ TOUTE logique de permissions

**Priorité** : 🔴 **P0 — À appliquer dès maintenant**

---

### 🟠 Majeur: Information Disclosure via Count

#### Problème

Le `totalCount` révèle des informations sensibles via énumération.

**Vecteur d'attaque** :

```bash
# Test 1: Email existe ?
GET /admin/users?search=ceo@target-company.com
→ Response: { totalCount: 1 }  # ✅ Email existe dans la DB!

# Test 2: Email n'existe pas ?
GET /admin/users?search=fake@test.com
→ Response: { totalCount: 0 }  # ❌ Email n'existe pas

# Résultat: Énumération complète de tous les emails
```

**Impact** :
- 🟠 **Énumération** : Découverte d'emails/usernames
- 🟠 **OSINT** : Profilage des utilisateurs (noms, rôles)
- 🟠 **Timing attacks** : Combiné avec temps de réponse

#### Solution

**Option 1 : Fuzzy Count**

```tsx
import { UserRole } from "@/lib/constants/roles.constant";

// Rôles qui voient le count exact
const EXACT_COUNT_ROLES: UserRole[] = [UserRole.ADMIN];

function getFuzzyCount(realCount: number, userRole: UserRole): number {
  // Les rôles autorisés voient le vrai count
  if (EXACT_COUNT_ROLES.includes(userRole)) return realCount;

  // Autres rôles voient des fourchettes floues
  if (realCount === 0) return 0;
  if (realCount < 10) return 10;
  if (realCount < 50) return 50;
  if (realCount < 100) return 100;
  return Math.ceil(realCount / 100) * 100;  // Arrondi à la centaine
}

async function getUsers(
  filters: GetUsersFilters,
  userId: string,
  userRole: UserRole
) {
  const [users, realCount] = await prisma.$transaction([...]);

  return {
    users,
    totalCount: getFuzzyCount(realCount, userRole),  // ✅ Count flouté selon rôle
  };
}
```

**Option 2 : Pas de Count pour Recherches Sensibles**

```tsx
async function getUsers(filters: GetUsersFilters, userId: string) {
  // Si recherche contient email = info sensible, pas de count
  const skipCount = filters.search.includes("@");

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({ ... }),
    skipCount ? Promise.resolve(-1) : prisma.user.count({ ... }),
  ]);

  return {
    users,
    totalCount: skipCount ? -1 : totalCount,  // Frontend affiche "Plusieurs résultats"
  };
}
```

**Priorité** : 🟠 **P1 — À implémenter rapidement**

---

### 🟠 Majeur: Mass Assignment dans Actions

#### Problème

Les Server Actions passent `parsedInput` directement à Prisma sans whitelist explicite.

**Vecteur d'attaque** :

```tsx
// ❌ CODE VULNÉRABLE
export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: parsedInput,  // ❌ Si schema contient "role", l'utilisateur devient admin!
    });
    return { success: true, user };
  });
```

**Exploitation** :
```tsx
// Si UpdateProfileSchema contient:
const UpdateProfileSchema = z.object({
  name: z.string(),
  role: z.enum(["ADMIN", "CUSTOMER"]),  // ❌ Erreur de design
});

// L'utilisateur envoie:
{ name: "John", role: "ADMIN" }

// Résultat: Privilege Escalation → utilisateur devient admin
```

#### Solution

```tsx
// ✅ CORRECTION: Whitelist explicite des champs modifiables
export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ✅ Destructuring pour whitelist stricte
    const { name, email, bio } = parsedInput;

    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        name,    // ✅ Seulement champs autorisés
        email,
        bio,
        // ❌ JAMAIS: role, isAdmin, permissions, createdAt, etc.
      },
      select: { id: true, name: true, email: true },
    });

    return { success: true, user };
  });
```

**Règle** : **JAMAIS** `data: parsedInput` en entier, toujours destructurer.

**Priorité** : 🟠 **P1 — À auditer et corriger tous les endpoints**

---

### 🟡 Moyen: Parameter Pollution

#### Problème

Comportement avec paramètres URL dupliqués non documenté.

**Vecteur d'attaque** :

```bash
GET /admin/users?role=ADMIN&role=CUSTOMER&role=all
# Question: Quel rôle est utilisé ?
# - Premier (ADMIN) ?
# - Dernier (all) ?
# - Array (["ADMIN", "CUSTOMER", "all"]) ?
```

#### Solution

```tsx
// lib/parsers/nuqs.ts
const parseAsRole = createParser({
  parse(query) {
    // ✅ Si array, prendre premier élément
    const value = Array.isArray(query) ? query[0] : query;
    return userRoleFilters.includes(value) ? value : "all";
  },
  serialize(value) {
    return value;
  },
});
```

**Priorité** : 🟡 **P2 — À tester et documenter**

---

### 🟡 Moyen: Unicode Normalization

#### Problème

Recherche avec caractères Unicode peut contourner filtres/blacklists.

**Vecteur d'attaque** :

```bash
# Caractères cyrilliques lookalikes
GET /users?search=аdmin  # 'а' cyrillique (U+0430) pas 'a' latin (U+0061)

# Zero-width characters invisibles
GET /users?search=admin%E2%80%8B  # Zero-width space

# Homograph attack
GET /users?search=раypal  # 'а' et 'у' cyrilliques ressemblent à 'a' et 'y'
```

**Impact** :
- 🟡 **Bypass** : Contournement de blacklists
- 🟡 **Confusion** : Homograph attacks (phishing interne)

#### Solution

```tsx
// lib/parsers/nuqs.ts
const parseAsSafeSearch = createParser({
  parse(query) {
    if (!query) return "";

    // ✅ Normalisation Unicode NFD → NFC
    const normalized = query.normalize("NFC");

    // ✅ Suppression zero-width characters
    const cleaned = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

    // ✅ Truncate
    return cleaned.slice(0, MAX_SEARCH_LENGTH).trim();
  },
  serialize(value) {
    return value;
  },
});
```

**Priorité** : 🟡 **P2 — À implémenter**

---

### 🟡 Moyen: Cache Poisoning

#### Problème

Absence de cache headers explicites pour pages protégées.

**Vecteur d'attaque** :

```bash
# CDN cache une page admin avec paramètres malicieux
GET /admin/users?search=<script>alert(1)</script>
→ CDN cache la réponse
→ Prochain admin voit la page cached (potentiellement avec XSS dans meta tags)
```

#### Solution

```tsx
// app/(protected)/admin/users/page.tsx
export const revalidate = 0;           // ✅ Pas de cache
export const dynamic = "force-dynamic"; // ✅ Toujours dynamique

// Ou headers explicites
export async function generateMetadata() {
  return {
    robots: { index: false, follow: false },
    other: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  };
}
```

**Priorité** : 🟡 **P2 — À auditer toutes les pages protégées**

---

### 🟡 Moyen: Timing Attacks

#### Problème

Différences de temps de réponse révèlent des informations.

**Vecteur d'attaque** :

```bash
GET /users?search=a
→ 250ms (1000 résultats trouvés)

GET /users?search=zzz
→ 50ms (0 résultats)

# Conclusion: Distribution des noms (peu de 'z', beaucoup de 'a')
```

#### Solution

```tsx
// utils/security/constant-time.ts
async function constantTimeDelay(minMs: number = 100) {
  const start = Date.now();

  // Attendre au minimum minMs
  await new Promise(resolve => {
    const elapsed = Date.now() - start;
    if (elapsed < minMs) {
      setTimeout(resolve, minMs - elapsed);
    } else {
      resolve(undefined);
    }
  });
}

// Dans le service
async function getUsers(filters: GetUsersFilters) {
  const startTime = Date.now();

  const [users, totalCount] = await prisma.$transaction([...]);

  // ✅ Toujours répondre en minimum 100ms
  await constantTimeDelay(100);

  return { users, totalCount };
}
```

**Priorité** : 🟡 **P3 — Nice to have**

---

### 🟡 Moyen: Business Logic Flaw

#### Problème

Combinaison de filtres peut révéler des données sensibles.

**Vecteur d'attaque** :

```bash
# Attaquant veut savoir si "John Doe" est admin:
GET /users?search=John+Doe&role=ADMIN
→ totalCount: 1  # ✅ John Doe est admin!

GET /users?search=John+Doe&role=CUSTOMER
→ totalCount: 0  # ❌ Pas customer

# Résultat: Profilage précis des utilisateurs
```

#### Solution

```tsx
import { UserRole } from "@/lib/constants/roles.constant";

// Rôles autorisés à combiner plusieurs filtres
const UNRESTRICTED_FILTER_ROLES: UserRole[] = [UserRole.ADMIN];

async function getUsers(
  filters: GetUsersFilters,
  userId: string,
  userRole: UserRole
) {
  const canCombineFilters = UNRESTRICTED_FILTER_ROLES.includes(userRole);

  // ✅ Rôles restreints ne peuvent pas combiner search + role
  if (!canCombineFilters && filters.search && filters.role !== "all") {
    throw new ForbiddenError("Combinaison de filtres non autorisée");
  }

  // ... reste du code
}
```

**Priorité** : 🟡 **P2 — À évaluer selon sensibilité des données**

---

## Checklist de Sécurité

### Template Service Sécurisé

Tous les services de filtrage doivent suivre ce template :

```tsx
import "server-only";
import { UserRole } from "@/lib/constants/roles.constant";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { filterRatelimit } from "@/lib/ratelimit";
import { constantTimeDelay } from "@/utils/security/constant-time";
import { getFuzzyCount } from "@/utils/security/fuzzy-count";

// Définir les rôles avec accès non restreint
const UNRESTRICTED_ROLES: UserRole[] = [UserRole.ADMIN];
const UNRESTRICTED_FILTER_ROLES: UserRole[] = [UserRole.ADMIN];

async function getEntity(
  filters: GetEntityFilters,
  userId: string,     // ✅ 1. Toujours userId
  userRole: UserRole  // ✅ 2. Toujours userRole (JAMAIS de booléen)
): Promise<GetEntityResult> {
  // ✅ 3. Rate limiting
  await checkRatelimit(filterRatelimit, userId);

  // ✅ 4. Normalisation unicode + suppression zero-width
  const safeSearch = filters.search
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .slice(0, MAX_SEARCH_LENGTH)
    .trim();

  // ✅ 5. Validation business logic (combinaisons interdites)
  const canCombineFilters = UNRESTRICTED_FILTER_ROLES.includes(userRole);
  if (!canCombineFilters && safeSearch && filters.role !== "all") {
    throw new ForbiddenError("Combinaison de filtres non autorisée");
  }

  // ✅ 6. Re-validation complète
  const safePage = Math.max(1, Math.min(filters.page, MAX_PAGE));
  const safeSortBy = allowedFields.includes(filters.sortBy)
    ? filters.sortBy
    : DEFAULT_SORT_BY;

  // ✅ 7. Filtre userId par défaut (sauf rôles autorisés)
  const canAccessAllData = UNRESTRICTED_ROLES.includes(userRole);
  const whereClause = {
    ...(!canAccessAllData && { userId }),
    ...(safeSearch && {
      OR: [
        { name: { contains: safeSearch, mode: "insensitive" as const } },
        { email: { contains: safeSearch, mode: "insensitive" as const } },
      ],
    }),
  };

  // ✅ 8. $transaction pour parallélisme
  const [entities, realCount] = await prisma.$transaction([
    prisma.entity.findMany({
      where: whereClause,
      select: { id: true, name: true },  // ✅ 9. Jamais select *
      orderBy: { [safeSortBy]: safeOrder },
      skip: (safePage - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,           // ✅ 10. Toujours limite stricte
    }),
    prisma.entity.count({ where: whereClause }),
  ]);

  // ✅ 11. Constant-time response (optionnel)
  await constantTimeDelay(100);

  return {
    entities,
    totalCount: getFuzzyCount(realCount, userRole),  // ✅ 12. Fuzzy count selon rôle
    totalPages: Math.ceil(realCount / DEFAULT_PAGE_SIZE),
    currentPage: safePage,
  };
}

export { getEntity };
```

### Checklist Actions

```tsx
"use server";

import { UpdateEntitySchema } from "@/features/entity/schemas/entity.schema";
import { authActionClient } from "@/lib/safe-action";

export const updateEntityAction = authActionClient
  .inputSchema(UpdateEntitySchema)
  .action(async ({ parsedInput, ctx }) => {
    // ✅ 1. Destructuring explicite (jamais data: parsedInput)
    const { name, email, bio } = parsedInput;

    // ✅ 2. Vérification ownership
    const existing = await prisma.entity.findUnique({
      where: { id: parsedInput.id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== ctx.userId) {
      throw new ForbiddenError("Accès non autorisé");
    }

    // ✅ 3. Whitelist stricte
    const entity = await prisma.entity.update({
      where: { id: parsedInput.id },
      data: {
        name,
        email,
        bio,
        // ❌ JAMAIS: role, isAdmin, userId, createdAt
      },
      select: { id: true, name: true, email: true },
    });

    return { success: true, entity };
  });
```

---

## Plan d'Action

### Phase 1 : Corrections Critiques (P0) — Semaine 1

- [ ] **Rate Limiting**
  - [ ] Installer `@upstash/ratelimit` + setup Redis
  - [ ] Créer `lib/ratelimit.ts` avec `filterRatelimit`
  - [ ] Créer `utils/ratelimit/check-ratelimit.ts`
  - [ ] Ajouter rate limit à TOUS les services de filtrage
  - [ ] Tests : vérifier 429 après 100 requêtes/minute

- [ ] **IDOR (Authorization)**
  - [ ] Auditer TOUS les services `get-*.service.ts`
  - [ ] Ajouter paramètre `userId: string` obligatoire
  - [ ] Ajouter `whereClause: { userId }` par défaut (sauf admin)
  - [ ] Tests : vérifier qu'user A ne voit pas données user B

### Phase 2 : Corrections Majeures (P1) — Semaine 2

- [ ] **Information Disclosure**
  - [ ] Créer `utils/security/fuzzy-count.ts`
  - [ ] Implémenter fuzzy count dans services
  - [ ] Option : désactiver count si `search.includes("@")`
  - [ ] Tests : vérifier arrondi pour non-admin

- [ ] **Mass Assignment**
  - [ ] Auditer TOUTES les actions `*-*.action.ts`
  - [ ] Remplacer `data: parsedInput` par destructuring
  - [ ] Créer whitelist explicite par action
  - [ ] Tests : vérifier qu'on ne peut pas modifier `role`/`isAdmin`

### Phase 3 : Hardening (P2) — Semaine 3

- [ ] **Unicode Normalization**
  - [ ] Modifier `parseAsSafeSearch` avec `.normalize("NFC")`
  - [ ] Ajouter regex suppression zero-width chars
  - [ ] Tests : caractères cyrilliques, zero-width, etc.

- [ ] **Cache Headers**
  - [ ] Ajouter `export const dynamic = "force-dynamic"` pages admin
  - [ ] Ajouter headers `Cache-Control` explicites
  - [ ] Tests : vérifier headers avec DevTools

- [ ] **Business Logic**
  - [ ] Identifier combinaisons de filtres sensibles
  - [ ] Ajouter guards dans services
  - [ ] Tests : vérifier 403 sur combinaisons interdites

- [ ] **Parameter Pollution**
  - [ ] Tester comportement nuqs avec params dupliqués
  - [ ] Documenter comportement dans `filter.md`
  - [ ] Ajouter protection si nécessaire

### Phase 4 : Nice to Have (P3) — Semaine 4

- [ ] **Constant-Time Responses**
  - [ ] Créer `utils/security/constant-time.ts`
  - [ ] Implémenter dans services sensibles
  - [ ] Tests : mesurer temps de réponse

- [ ] **Monitoring**
  - [ ] Sentry alerts sur rate limit hits
  - [ ] Sentry alerts sur `ForbiddenError` (IDOR attempts)
  - [ ] Dashboard usage filtres (détection anomalies)

---

## Tableau de Synthèse

| Faille | Gravité | Exploitabilité | Impact | CVSS | Priorité | Effort |
|--------|---------|----------------|--------|------|----------|--------|
| **Rate Limiting** | 🔴 Critique | Facile | DoS + Énumération | 8.6 | P0 | 4h |
| **IDOR** | 🔴 Critique | Facile | Data Breach | 9.1 | P0 | 8h |
| **Info Disclosure (Count)** | 🟠 Majeur | Facile | Énumération | 6.5 | P1 | 4h |
| **Mass Assignment** | 🟠 Majeur | Moyen | Privilege Escalation | 7.3 | P1 | 8h |
| **Parameter Pollution** | 🟡 Moyen | Moyen | Bypass Filtres | 5.0 | P2 | 2h |
| **Unicode Attacks** | 🟡 Moyen | Moyen | Bypass Validation | 4.8 | P2 | 2h |
| **Cache Poisoning** | 🟡 Moyen | Difficile | XSS Stored | 6.0 | P2 | 2h |
| **Timing Attacks** | 🟡 Moyen | Difficile | Info Leak | 3.5 | P3 | 4h |
| **Business Logic** | 🟡 Moyen | Facile | Info Leak | 5.5 | P2 | 4h |

**Légende** :
- 🔴 Critique (CVSS 9.0-10.0) : Exploitation facile, impact majeur
- 🟠 Majeur (CVSS 7.0-8.9) : Exploitation moyenne, impact sérieux
- 🟡 Moyen (CVSS 4.0-6.9) : Exploitation difficile ou impact limité

**Effort total estimé** : ~38 heures (1 semaine à temps plein)

---

## Recommandations Finales

### Avant Mise en Production

**BLOCKERS (P0)** :
1. ✅ Rate limiting opérationnel sur TOUS les endpoints de filtrage
2. ✅ Vérifications IDOR (userId) dans TOUS les services

**FORTEMENT RECOMMANDÉ (P1)** :
3. ✅ Fuzzy count pour non-admin
4. ✅ Audit complet mass assignment dans actions

### Tests de Non-Régression

```bash
# Test 1: Rate limiting
for i in {1..150}; do curl -H "Cookie: session=..." /api/users?page=$i; done
# Attendu: 100 success (200) + 50 rate limited (429)

# Test 2: IDOR
curl -H "Cookie: userA-session" /api/documents
# Attendu: Seulement documents de userA

curl -H "Cookie: userB-session" /api/documents
# Attendu: Seulement documents de userB (pas ceux de userA)

# Test 3: Mass assignment
curl -X PATCH -H "Cookie: session=..." \
  -d '{"name":"Hacker","role":"ADMIN"}' \
  /api/profile
# Attendu: 400 Bad Request ou role ignoré

# Test 4: Count fuzzing
curl -H "Cookie: user-session" /api/users
# Attendu: totalCount arrondi (10, 50, 100, etc.) pour non-admin

curl -H "Cookie: admin-session" /api/users
# Attendu: totalCount exact pour admin
```

### Monitoring Post-Deploy

```javascript
// Sentry custom instrumentation
import * as Sentry from "@sentry/nextjs";

// Alert si trop de rate limit hits
if (rateLimitHits > 1000) {
  Sentry.captureMessage("Rate limit abuse detected", {
    level: "warning",
    extra: { userId, ip, endpoint },
  });
}

// Alert sur tentatives IDOR
if (error instanceof ForbiddenError) {
  Sentry.captureException(error, {
    level: "warning",
    extra: { userId, requestedResource, ownership },
  });
}
```

---

**Prochaine révision** : 2026-03-19 (après implémentation P0-P1)

**Contact** : security@ascender.dev
