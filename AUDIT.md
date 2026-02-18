# Audit Complet - Ascender SaaS Boilerplate

## 1. Résumé Exécutif

Le projet est un boilerplate SaaS mature, construit sur Next.js 16 (App Router) avec une architecture feature-based bien organisée. Le code est globalement de haute qualité avec des conventions strictes appliquées de manière cohérente. Néanmoins, l'audit révèle des problèmes de sécurité notables (DSN Sentry hardcodé, PII activé), du code mort, des constantes dupliquées en violation de la hiérarchie documentée, et des lacunes de couverture (loading.tsx manquants, page projets vide).

**Note finale : 7.5/10**

---

## 2. Cartographie Architecture

### Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript strict |
| Styling | Tailwind CSS v4 + Shadcn/ui |
| BDD | PostgreSQL (Neon) via Prisma 7 |
| Auth | Better Auth |
| Paiements | Stripe (subscriptions) |
| Emails | Resend + React Email |
| Storage | Cloudflare R2 + Sharp |
| Rate Limiting | Upstash Redis |
| Monitoring | Sentry |
| Validation | Zod 4 |
| Forms | TanStack Form |
| Actions | next-safe-action |
| URL State | Nuqs |
| HTTP Client | up-fetch |

### Pattern architectural

**Feature-Based Architecture** (tendance DDD lite) avec séparation claire :

```
features/{domain}/
  ├── actions/      (Server Actions via next-safe-action)
  ├── components/   (UI composants, forms/, modals/)
  ├── emails/       (Templates React Email)
  ├── schemas/      (Zod validation)
  └── services/     (Business logic, server-only)
```

### Flux principal d'exécution

```
Requête HTTP → Layout (auth check) → Page (server component)
  → Services (business logic) → Prisma (DB) → Response

Client interactions → Forms (TanStack) → Server Actions / API Routes
  → Services → DB + Side effects (email, Stripe, R2)
```

---

## 3. Analyse Détaillée par Dossier

### `lib/` - Infrastructure

| Fichier | Rôle | Qualité |
|---------|------|---------|
| `auth.ts` | Config Better Auth complète (email, Google, hooks DB) | Excellente |
| `env.ts` | Validation T3 Env avec Zod | Excellente |
| `safe-action.ts` | 3 niveaux d'action clients (public/auth/admin) | Excellente |
| `session.ts` | Guards d'auth granulaires (6 niveaux) | Excellente |
| `prisma.ts` | Client Prisma avec adapter PG et singleton dev | Bonne |
| `r2.ts` | Wrapper S3 avec validation stricte des clés | Excellente |
| `optimize.ts` | Pipeline Sharp (avatar, banner, generic) | Bonne |
| `resend.ts` | Abstraction email avec mode dev et safe wrapper | Excellente |
| `ratelimit.ts` | 2 limiteurs Upstash (contact + authenticated) | Bonne |
| `up-fetch.ts` | Wrapper minimal `up(fetch)` | Bonne |
| `parsers/nuqs.ts` | Parsers URL sécurisés (page, search, enum, sort) | Bonne |

### `features/` - Domaines métier

**account/** : Gestion profil, avatar, mot de passe, suppression compte. Service layer complet avec cascade Stripe + R2 + email.

**auth/** : Schemas robustes (password 12+ chars, upper/lower/digit), emails transactionnels, vérification email custom.

**billing/** : Intégration Stripe complète (checkout, portal, webhooks). Webhook handler avec idempotence via Redis. Cache invoices.

**contact/** : Flow simple action → service → email. Rate limited par IP.

**users/** : Admin user management avec filtres URL-based, tri serveur, pagination.

**pricing/** : Composants de pricing statiques.

**cookie-consent/** : Bandeau cookie avec préférences.

### `app/` - Routes

Structure bien organisée en groupes `(public)`, `(protected)`, `api`. Les layouts appliquent les guards d'auth. Pages conformes aux conventions SEO (metadata, JSON-LD).

### `utils/` - Utilitaires transversaux

Error handling hiérarchique (`AppError` → sous-classes HTTP), rate limiting, string processing, date formatting. Tout est testé.

---

## 4. Problèmes Classés par Criticité

### CRITIQUE

**C1 - Sentry DSN hardcodé dans le code source**

- `instrumentation-client.ts:8`, `sentry.server.config.ts:7`, `sentry.edge.config.ts:7`
- Le DSN Sentry est en dur dans 3 fichiers commités. Bien que le DSN ne soit pas un "secret" au sens strict, il expose l'endpoint Sentry et peut permettre du spam d'événements.
- `sentry.client.config.ts` utilise correctement `process.env.NEXT_PUBLIC_SENTRY_DSN` mais les 3 autres non.
- **Fix** : Utiliser `process.env.NEXT_PUBLIC_SENTRY_DSN` partout et l'ajouter dans `env.ts`.

**C2 - `sendDefaultPii: true` dans Sentry**

- `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`
- PII (Personally Identifiable Information) est envoyé à Sentry par défaut. Cela inclut potentiellement les cookies, IP, user-agent, headers. En production, cela pose un risque RGPD majeur pour un produit SaaS français.
- **Fix** : Désactiver `sendDefaultPii` ou le configurer de manière granulaire.

**C3 - `tracesSampleRate: 1` en production (server/edge)**

- `sentry.server.config.ts:11`, `sentry.edge.config.ts:11`
- 100% des transactions tracées en production = surcharge Sentry + coût + données sensibles massives. Seul `sentry.client.config.ts` ajuste correctement (0.1 en prod).
- **Fix** : `tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1`

**C4 - Email verification custom bypasse Better Auth**

- `features/account/services/update-profile.service.ts:35-51` crée des tokens de vérification manuellement via `crypto.randomBytes` et la table `Verification`, en parallèle du système natif Better Auth.
- Risque : désynchronisation entre le mécanisme natif et le custom, tokens potentiellement non invalidés correctement.
- **Fix** : Utiliser `auth.api.changeEmail()` de Better Auth au lieu de réimplémenter la logique.

### IMPORTANT

**I1 - Code mort : `handleActionError`**

- `utils/errors/handle-action-error.ts` n'est importé nulle part dans le code de production (seulement dans les tests).
- Le projet utilise `next-safe-action` qui gère les erreurs via `handleServerError` dans `safe-action.ts`.
- **Fix** : Supprimer le fichier et ses tests.

**I2 - Code mort : `getRequestIdentifier`**

- `utils/ratelimit/get-request-identifier.ts` - La fonction `getRequestIdentifier(request: Request)` n'est jamais appelée en production. Seul `getActionIdentifier()` est utilisé.
- **Fix** : Supprimer la fonction inutilisée.

**I3 - Constantes dupliquées : violation de la hiérarchie Source of Truth**

- La documentation CLAUDE.md définit `lib/constants/query.constant.ts` comme source unique pour `MAX_PAGE`, `MAX_SEARCH_LENGTH`, `PAGE_SIZE`.
- En réalité, ce fichier **n'existe pas**. Les constantes sont dupliquées dans :
  - `lib/parsers/nuqs.ts` (MAX_PAGE=1000, MAX_SEARCH_LENGTH=100)
  - `features/users/services/get-users.service.ts` (PAGE_SIZE=12, MAX_SEARCH_LENGTH=100, MAX_PAGE=1000)
  - `features/users/schemas/users-filter.schema.ts` (MAX_SEARCH_LENGTH=100)
- **Fix** : Créer `lib/constants/query.constant.ts` comme documenté et importer partout.

**I4 - 17 pages sans `loading.tsx`**

- Toutes les pages auth, legal, contact, tarifs, plan-du-site, projets, admin root, dashboard root manquent de loading.tsx.
- Impact UX : pas de feedback visuel pendant le chargement de ces routes.
- **Fix** : Ajouter des loading.tsx pour au moins les pages avec data fetching.

**I5 - Page projets vide/placeholder**

- `app/(protected)/dashboard/projets/page.tsx` ne contient qu'un `<h1>`. Gaté par `requireCustomerProSubscription` mais aucune fonctionnalité.
- Risque : un utilisateur payant accède à une page vide.

**I6 - Admin dashboard avec données statiques hardcodées**

- `app/(protected)/admin/page.tsx` affiche "0" partout en dur. Pas de data fetching réel.
- Acceptable pour un boilerplate mais devrait être signalé clairement.

**I7 - Duplication settings pages dashboard/admin**

- `app/(protected)/dashboard/parametres/page.tsx` et `app/(protected)/admin/parametres/page.tsx` sont quasi-identiques (même structure, mêmes composants). La seule différence : `requireCustomer()` vs `requireAdmin()` et `showStripeWarning`.
- **Fix** : Extraire un composant commun `SettingsContent` paramétrable.

**I8 - Description mot de passe incorrecte**

- `features/account/components/forms/password-form.tsx:120` dit "Minimum 8 caractères" mais le schema requiert 12 caractères (`MIN_PASSWORD_LENGTH = 12`).
- **Fix** : Corriger en "Minimum 12 caractères".

### MINEUR

**M1 - `env.ts` : Redis optionnel avec valeurs placeholder**

- `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont optionnels avec defaults "placeholder". Le `checkRatelimit` fait une comparaison hardcodée avec `"your-url-here"` qui ne correspond pas au default.
- Pas un bug (le default est `https://placeholder.upstash.io`) mais la logique de bypass est fragile.

**M2 - `lib/auth-client.ts` exporte `authClient` + destructured `signIn/signOut/signUp`**

- Double export inutile. `AuthClientType` exporté aussi mais semble inutilisé.

**M3 - Coverage directory dans le repo**

- Le dossier `coverage/` est gitignored mais est présent dans la structure. Vérifier qu'il n'est pas commité.

**M4 - FieldDescription "Minimum 8 caractères, différent de l'ancien"**

- Même problème que I8, sur la description du champ newPassword.

**M5 - `verify-email.service.ts` retourne des status objects au lieu de throw**

- Utilise un pattern union `{ status: "invalid_token" | "expired" | ... }` au lieu du pattern "throw or return" documenté dans CLAUDE.md. Cohérent en soi mais diverge de la convention du projet.

**M6 - Absence de middleware Next.js**

- Pas de `middleware.ts` pour la redirection des utilisateurs non authentifiés, la gestion du mode maintenance, ou la protection CORS. Le mode maintenance est géré comment ? (Variable env mais pas de middleware pour l'appliquer sauf si Better Auth le gère).

**M7 - `instrumentation-client.ts` duplique `sentry.client.config.ts`**

- Deux fichiers configurent Sentry côté client avec des configs légèrement différentes (sample rates, DSN source). Risque de double-init.

---

## 5. Plan d'Amélioration Priorisé

### Priorité 1 (Sécurité/Critique)

1. **Externaliser le DSN Sentry** dans `env.ts` et utiliser la variable d'env partout
2. **Désactiver `sendDefaultPii`** ou configurer avec un filtre RGPD-compliant
3. **Réduire `tracesSampleRate`** à 0.1 en production pour server/edge
4. **Auditer la vérification email custom** et migrer vers `auth.api.changeEmail()` de Better Auth

### Priorité 2 (Architecture/Cohérence)

5. **Créer `lib/constants/query.constant.ts`** comme documenté et supprimer les duplications
6. **Supprimer le code mort** : `handleActionError`, `getRequestIdentifier`
7. **Corriger la description password** (8 → 12 caractères)
8. **Ajouter `loading.tsx`** pour les pages à data fetching (billing, settings, users, contact, auth)
9. **Extraire le composant settings commun** entre dashboard et admin

### Priorité 3 (Qualité/Complétude)

10. **Ajouter un middleware Next.js** pour maintenance mode, redirections auth, headers de sécurité
11. **Consolider la config Sentry** client (supprimer le doublon instrumentation-client / sentry.client.config)
12. **Signaler clairement les pages placeholder** (projets, admin dashboard) dans le boilerplate

---

## 6. Notation Détaillée

| Critère | Note | Justification |
|---------|------|---------------|
| **Architecture** | 8/10 | Feature-based solide, séparation claire services/actions/schemas. La hiérarchie source-of-truth documentée n'est pas implémentée (query.constant.ts manquant). |
| **Qualité du code** | 8/10 | Conventions très strictes et bien suivies (naming, typing, patterns). Code lisible et cohérent. Un peu de code mort et une duplication settings. |
| **Maintenabilité** | 8/10 | CLAUDE.md exhaustif, patterns reproductibles, tests présents. La documentation est parfois en avance sur l'implémentation. |
| **Scalabilité** | 7/10 | Architecture extensible, pagination serveur, feature-based. Manque de middleware, pas de caching strategy au-delà des invoices. Page projets placeholder. |
| **Sécurité** | 6/10 | Auth solide (Better Auth, rate limiting, guards), validation Zod partout. Mais DSN Sentry hardcodé, PII envoyées, vérification email custom potentiellement fragile, pas de CSP middleware. |
| **Performance** | 7.5/10 | Server components par défaut, $transaction Prisma, Sharp optimization, Redis cache invoices. Sentry traces à 100% en prod est un problème. Loading.tsx manquants dégradent le perceived performance. |

### Note finale : 7.5/10

**Justification** : Le projet est un boilerplate SaaS de qualité supérieure à la moyenne avec une architecture bien pensée et des conventions strictes. Les principales faiblesses sont concentrées sur la sécurité (config Sentry) et la cohérence entre la documentation et l'implémentation (constantes dupliquées, fichier source-of-truth manquant). Le code métier est solide et production-ready pour les fonctionnalités implémentées.

---

## 7. Auto-critique de l'Audit

### Potentiellement manqué

- **Tests E2E** : pas de vérification de l'existence de tests Playwright/Cypress
- **Performance runtime** : pas de profiling réel (bundle size, TTFB, LCP)
- **Accessibilité réelle** : vérification ARIA dans le code mais pas de test avec lecteur d'écran
- **Types générés Prisma** : le contenu de `lib/generated/prisma/` n'a pas été inspecté en détail
- **Emails React** : les templates email n'ont pas été vérifiés pour le rendu cross-client

### Hypothèses faites

- Le code dans `coverage/` n'est pas commité (gitignore le confirme)
- Better Auth gère correctement la session côté middleware (pas de middleware Next.js visible)
- Les composants Shadcn/ui (`components/ui/`) sont standards et non modifiés significativement
- Zod v4 est compatible avec tous les usages actuels (migration récente probable)

### Éléments nécessitant validation humaine

- La logique de vérification email custom vs Better Auth native : risque de désynchronisation à confirmer avec l'auteur
- Le `sendDefaultPii: true` est-il intentionnel (conformité RGPD à vérifier avec le DPO)
- La page projets vide est-elle un placeholder intentionnel ou un oubli
- Le ratio de duplication entre les pages settings dashboard/admin : est-ce voulu pour permettre une divergence future
