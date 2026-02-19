# Production Readiness Plan — Ascender SaaS Boilerplate

## 1. Analyse de la codebase

### Architecture globale

```
app/                          # 5 API routes, ~15 pages, error boundaries
features/                     # 7 modules (account, auth, billing, contact, cookie-consent, pricing, users)
lib/                          # 19 fichiers infra (auth, prisma, stripe, redis, r2, parsers, constants)
utils/                        # 8 fichiers (errors, ratelimit, date, string)
hooks/                        # 2 hooks (useDebounce, useIsMobile)
components/                   # UI partagés (ui/, public/, protected/, pagination)
__tests__/                    # 20 fichiers de tests existants
```

### Inventaire des fichiers source testables

| Couche | Fichiers | Testables | Tests existants | Couverture |
|--------|----------|-----------|-----------------|------------|
| **utils/errors/** | 4 | 4 | 2 (errors, handle-api-error) | ~50% |
| **utils/string/** | 3 | 3 | 3 (slugify, truncate, get-initials) | 100% |
| **utils/date/** | 1 | 1 | 1 (format-date) | 100% |
| **utils/ratelimit/** | 2 | 2 | 2 (check-ratelimit, get-request-identifier) | 100% |
| **lib/constants/** | 4 | 4 | 1 (via users-filters) | ~25% |
| **lib/parsers/** | 1 | 1 | 1 (nuqs) | 100% |
| **lib/utils.ts** | 1 | 1 | 1 (cn) | 100% |
| **lib/optimize.ts** | 1 | 1 | 0 | 0% |
| **lib/r2.ts** | 1 | 1 | 0 | 0% |
| **lib/session.ts** | 1 | 1 | 0 | 0% |
| **lib/resend.ts** | 1 | 1 | 0 | 0% |
| **lib/safe-action.ts** | 1 | 1 | 0 | 0% |
| **features/*/schemas/** | 7 | 7 | 7 | 100% |
| **features/*/services/** | 8 | 8 | 2 (get-billing, get-users) | 25% |
| **features/*/actions/** | 4 | 4 | 0 | 0% |
| **features/*/constants/** | 2 | 2 | 1 | 50% |
| **app/api/** | 5 routes | 5 | 0 | 0% |

### Etat actuel des tests

- **20 fichiers de tests**
- **274 tests** (273 passants, **1 en echec**)
- **Test en echec** : `users-filters.constant.test.ts` — attend `"Admin"` mais la source renvoie `"Administrateur"`
- **Coverage config** : couvre `lib/**/*.ts` et `utils/**/*.ts`, exclut les fichiers infra (env, prisma, stripe, redis, auth, resend, safe-action)

### Zones critiques (risque production)

| Zone | Risque | Impact | Tests existants |
|------|--------|--------|-----------------|
| **Stripe Webhooks** | CRITIQUE | Perte de paiements, desync abonnements | 0 |
| **Suppression de compte** | CRITIQUE | Perte de donnees, cascade Stripe/R2/DB | 0 |
| **Auth (session/guards)** | CRITIQUE | Acces non autorise, escalade de privileges | 0 |
| **Checkout Stripe** | ELEVE | Echec de paiement, double abonnement | 0 |
| **Upload avatar (R2/optimize)** | ELEVE | Crash upload, fuite memoire sharp | 0 |
| **Rate limiting** | MOYEN | DDoS, abus du formulaire contact | Tests partiels |
| **API routes** | ELEVE | Injection, erreurs 500 non gerees | 0 |
| **Email sending** | MOYEN | Emails perdus, erreurs silencieuses | 0 |

### Dette technique identifiee

1. **Test en echec non corrige** : `roleLabels.ADMIN` attend `"Admin"` mais la source dit `"Administrateur"` — le test est faux
2. **Coverage config incomplete** : `features/**` n'est pas dans `coverage.include` — les services/schemas features ne sont pas dans le rapport
3. **Pas de tests pour `get-action-result.ts`** et `get-error-message.ts` — utilises partout dans les forms
4. **`lib/optimize.ts`** (sharp) — 0 tests, traite des buffers utilisateur
5. **`lib/r2.ts`** — 0 tests, operations S3 critiques

---

## 2. Strategie de testing complete

### Types de tests a implementer

#### A. Tests unitaires (Vitest) — Priorite P0

**Pourquoi** : Valident chaque fonction isolement. Rapides, fiables, base de la pyramide de tests.

Fichiers cibles :
- `utils/errors/get-action-result.ts` — utilise dans chaque form client
- `utils/errors/get-error-message.ts` — utilise dans chaque form client
- `lib/optimize.ts` — traitement d'image, validation de buffer
- `lib/r2.ts` — operations fichiers cloud (mock S3)
- `lib/resend.ts` — logique d'envoi email (mock Resend)
- `lib/session.ts` — parsing de role, guards d'acces
- `lib/safe-action.ts` — middleware auth/admin, gestion erreurs

#### B. Tests d'integration services (Vitest + mocks) — Priorite P0

**Pourquoi** : Les services orchestrent DB + APIs externes. Un bug ici = corruption de donnees en prod.

Fichiers cibles :
- `features/billing/services/stripe/handle-webhook.service.ts` — LE plus critique
- `features/billing/services/stripe/create-checkout-session.service.ts`
- `features/billing/services/stripe/create-portal-session.service.ts`
- `features/account/services/delete-account.service.ts` — cascade de suppression
- `features/account/services/update-profile.service.ts` — changement email complexe
- `features/account/services/update-password.service.ts`
- `features/account/services/update-avatar.service.ts`
- `features/contact/services/create-contact.service.ts`

#### C. Tests de schemas Zod — Priorite P1 (DEJA FAIT a 100%)

**Pourquoi** : Premiere ligne de defense contre les inputs invalides.

Statut : 7/7 schemas testes. Rien a ajouter sauf `avatar.schema.ts` (File validation).

#### D. Tests d'API routes (Vitest + mocks) — Priorite P1

**Pourquoi** : Points d'entree HTTP. Doivent gerer auth, validation, erreurs correctement.

Fichiers cibles :
- `app/api/stripe/webhooks/route.ts` — signature verification
- `app/api/stripe/checkout/route.ts` — auth + validation
- `app/api/stripe/portal/route.ts` — auth + role check
- `app/api/avatar/route.ts` — auth + file upload + rate limit

#### E. Tests de constantes/config — Priorite P2

**Pourquoi** : Garantir l'exhaustivite des Records (fail-fast si un enum est ajoute).

Fichiers cibles :
- `lib/constants/roles.constant.ts` — labels exhaustifs
- `lib/constants/subscription-status.constant.ts` — labels + ACTIVE_STATUSES
- `lib/constants/invoice-status.constant.ts` — labels exhaustifs
- `lib/constants/query.constant.ts` — valeurs par defaut coherentes

#### F. Tests de securite specifiques — Priorite P0

**Pourquoi** : Un SaaS avec paiement DOIT resister aux attaques courantes.

- Webhook Stripe : signature invalide, replay attack (event dedup), event inconnu
- Auth : session absente, role invalide, escalade de privilege
- Rate limiting : bypass tentative, placeholder credentials
- Input validation : XSS dans les champs, SQL injection via search params
- File upload : fichier trop gros, format invalide, buffer vide/corrompu

---

## 3. Plan d'action pour Claude Sonnet

### Phase 0 : Corriger le test en echec (5 min)

- [ ] **Fichier** : `__tests__/lib/constants/users-filters.constant.test.ts:35`
- [ ] **Action** : Changer `expect(roleLabels.ADMIN).toBe("Admin")` en `expect(roleLabels.ADMIN).toBe("Administrateur")`
- [ ] **Raison** : La source `roles.constant.ts` definit `ADMIN: "Administrateur"`, le test est faux
- [ ] Verifier que tous les 274 tests passent apres correction

### Phase 1 : Elargir la coverage config (10 min)

- [ ] **Fichier** : `vitest.config.ts`
- [ ] **Action** : Ajouter `features/**/*.ts` a `coverage.include`
- [ ] **Exclure** : `features/**/components/**`, `features/**/emails/**` (UI, pas testable en unit)
- [ ] Config finale attendue :
```ts
coverage: {
  provider: "v8",
  include: [
    "lib/**/*.ts",
    "utils/**/*.ts",
    "features/**/services/**/*.ts",
    "features/**/schemas/**/*.ts",
    "features/**/actions/**/*.ts",
    "features/**/constants/**/*.ts",
  ],
  exclude: [
    "lib/generated/**",
    "lib/env.ts",
    "lib/prisma.ts",
    "lib/stripe.ts",
    "lib/redis.ts",
    "lib/auth.ts",
    "lib/auth-client.ts",
    "lib/resend.ts",
    "lib/ratelimit.ts",
    "lib/safe-action.ts",
    "node_modules/**",
  ],
},
```

### Phase 2 : Tests unitaires manquants (utils/) — P0

#### 2a. `utils/errors/get-action-result.ts`

- [ ] Creer `__tests__/utils/errors/get-action-result.test.ts`
- [ ] Tests :
  - Retourne `data` quand result a `data`
  - Throw quand `result` est `undefined`
  - Throw avec `serverError` quand present
  - Throw quand `data` est absent
  - Throw avec message par defaut (`"Une erreur est survenue"`)
  - Throw avec le message de `serverError`

#### 2b. `utils/errors/get-error-message.ts`

- [ ] Creer `__tests__/utils/errors/get-error-message.test.ts`
- [ ] **Mock** : `up-fetch` (`isResponseError`)
- [ ] Tests :
  - Retourne le message d'une `Error` standard
  - Retourne le message du body pour un `ResponseError` avec `data.message`
  - Retourne le message par defaut pour un `ResponseError` sans `data.message`
  - Retourne le message par defaut pour un type inconnu (string, null, number)
  - Retourne `"Une erreur est survenue"` comme fallback

### Phase 3 : Tests lib/ manquants — P0

#### 3a. `lib/optimize.ts` (image processing)

- [ ] Creer `__tests__/lib/optimize.test.ts`
- [ ] **Mock** : `sharp` (retourner des buffers simules)
- [ ] Tests pour `validateImageBuffer` :
  - Throw `BadRequestError` pour buffer vide
  - Throw pour format non supporte (gif)
  - Throw pour dimensions excessives (>10000px)
  - Throw pour buffer non-image
  - Accepter jpeg, png, webp valides
- [ ] Tests pour `optimizeImage` :
  - Retourne buffer optimise avec format et taille
  - Utilise les options par defaut (1920x1080, quality 80, webp)
  - Respecte les options custom
  - Throw sur echec sharp
- [ ] Tests pour `optimizeAvatar` :
  - Retourne 256x256 webp
  - Throw sur buffer invalide
- [ ] Tests pour `optimizeBanner` :
  - Retourne 1500x500 webp quality 85
- [ ] Tests pour `getImageMetadata` :
  - Retourne width, height, format
  - Fallback a 0/"unknown" si metadata manquante

#### 3b. `lib/r2.ts` (S3/R2 operations)

- [ ] Creer `__tests__/lib/r2.test.ts`
- [ ] **Mock** : `@aws-sdk/client-s3` (`S3Client.send`), `@aws-sdk/s3-request-presigner`
- [ ] Tests pour `validateKey` :
  - Throw pour cle vide
  - Throw pour cle trop longue (>1024)
  - Throw pour cle avec `..` ou commencant par `/`
  - Accepter cle valide
- [ ] Tests pour `getPublicUrl` :
  - Retourne URL correcte (`{R2_PUBLIC_URL}/{key}`)
  - Throw pour cle invalide
- [ ] Tests pour `uploadFile` :
  - Appelle S3Client.send avec PutObjectCommand
  - Throw `BadRequestError` pour body vide
  - Throw `BadRequestError` pour contentType vide
  - Throw `ServiceUnavailableError` sur erreur S3
- [ ] Tests pour `deleteFile` :
  - Appelle S3Client.send avec DeleteObjectCommand
  - Throw `ServiceUnavailableError` sur erreur S3
- [ ] Tests pour `fileExists` :
  - Retourne true si fichier existe
  - Retourne false si erreur (fichier n'existe pas)
- [ ] Tests pour `getPrivateUrl` :
  - Retourne signed URL
  - Throw pour expiresIn hors bornes (<60, >604800)
  - Throw `ServiceUnavailableError` sur erreur

#### 3c. `lib/constants/` (exhaustivite)

- [ ] Creer `__tests__/lib/constants/roles.test.ts`
  - `roleLabels` a une entree pour chaque `UserRole`
  - `UserRole` contient ADMIN et CUSTOMER
- [ ] Creer `__tests__/lib/constants/subscription-status.test.ts`
  - `subscriptionStatusLabels` a une entree pour chaque `SubscriptionStatus`
  - `ACTIVE_SUBSCRIPTION_STATUSES` contient exactement active, trialing, past_due
  - `ALL_SUBSCRIPTION_STATUSES` contient les 8 statuts
- [ ] Creer `__tests__/lib/constants/invoice-status.test.ts`
  - `invoiceStatusLabels` a une entree pour les 5 statuts
- [ ] Creer `__tests__/lib/constants/query.test.ts`
  - `PAGINATION.maxPage` === 1000
  - `PAGINATION.defaultPageSize` === 12
  - `FILTERS.maxSearchLength` === 100
  - `SORTING.orders` contient asc et desc
  - `SORTING.defaultOrder` === "desc"

### Phase 4 : Tests services critiques — P0

#### 4a. `features/billing/services/stripe/handle-webhook.service.ts` — LE PLUS CRITIQUE

- [ ] Creer `__tests__/features/billing/services/stripe/handle-webhook.test.ts`
- [ ] **Mocks** : `stripe` (webhooks.constructEvent), `prisma`, `redis`, `@sentry/nextjs`, `@/lib/env`
- [ ] Tests :
  - **Signature invalide** : retourne `{ status: 400 }` avec message d'erreur
  - **Event deja traite** (idempotence) : redis.get retourne truthy, retourne 200 sans traitement
  - **`customer.subscription.created`** :
    - Cree/upsert subscription dans DB avec les bons champs
    - Gere customer string vs object
    - Log Sentry si StripeCustomer introuvable
    - Skip si priceId manquant
    - Skip si status invalide
  - **`customer.subscription.updated`** :
    - Met a jour subscription existante
    - Gere changement de status
    - Gere `cancelAtPeriodEnd`
  - **`customer.subscription.deleted`** :
    - Supprime subscription de la DB
    - Log Sentry si customer introuvable
  - **`invoice.*` events** :
    - Invalide le cache Redis pour le bon userId
    - Gere customerId null
    - Gere StripeCustomer introuvable
  - **Event inconnu** : ne crash pas, retourne 200
  - **Erreur interne** : Sentry.captureException + retourne 200 (ne pas renvoyer d'erreur a Stripe)

#### 4b. `features/billing/services/stripe/create-checkout-session.service.ts`

- [ ] Creer `__tests__/features/billing/services/stripe/create-checkout-session.test.ts`
- [ ] **Mocks** : `prisma`, `stripe`
- [ ] Tests :
  - Cree session Stripe avec les bons params
  - Retourne `{ url }` de la session
  - Throw `UnauthorizedError` si user introuvable
  - Throw `ForbiddenError` si email non verifie
  - Throw `ForbiddenError` si role !== CUSTOMER
  - Throw `BadRequestError` si priceId invalide
  - Throw `ConflictError` si abonnement actif existant
  - Cree un Stripe customer si inexistant
  - Synchronise le Stripe customer existant (email/name)
  - Throw `BadRequestError` si session.url est null

#### 4c. `features/billing/services/stripe/create-portal-session.service.ts`

- [ ] Creer `__tests__/features/billing/services/stripe/create-portal-session.test.ts`
- [ ] **Mocks** : `prisma`, `stripe`
- [ ] Tests :
  - Cree portal session, retourne `{ url }`
  - Throw `UnauthorizedError` si user introuvable
  - Throw `ForbiddenError` si email non verifie
  - Throw `ForbiddenError` si role !== CUSTOMER
  - Throw `NotFoundError` si pas de StripeCustomer
  - Throw `BadRequestError` si portalSession.url est null

#### 4d. `features/account/services/delete-account.service.ts`

- [ ] Creer `__tests__/features/account/services/delete-account.test.ts`
- [ ] **Mocks** : `prisma`, `stripe`, `redis`, `@/lib/r2` (deleteFile), `@/lib/resend` (sendEmail)
- [ ] Tests :
  - Supprime l'utilisateur de la DB
  - Supprime le customer Stripe si CUSTOMER
  - Ne supprime pas Stripe si ADMIN
  - Invalide le cache Redis (subscription + invoices)
  - Supprime l'avatar R2 si present
  - Ne supprime pas l'avatar si image est null ou ne commence pas par "avatars"
  - Envoie un email de confirmation
  - Ne crash pas si l'email echoue
  - Throw `BadRequestError` si user introuvable
  - Throw `BadRequestError` si confirmation !== email
  - Throw `ForbiddenError` si dernier admin

#### 4e. `features/account/services/update-profile.service.ts`

- [ ] Creer `__tests__/features/account/services/update-profile.test.ts`
- [ ] **Mocks** : `prisma`, `@/lib/auth`, `next/cache`, `next/headers`
- [ ] Tests :
  - Retourne user inchange si rien ne change
  - Met a jour le nom seul (auth.api.updateUser)
  - Change l'email (auth.api.changeEmail + revalidatePath)
  - Change nom + email ensemble
  - Throw `BadRequestError` si user introuvable
  - Throw `ConflictError` si email deja utilise
  - `emailChanged: true` quand email change
  - `emailChanged: false` quand seul le nom change

#### 4f. `features/account/services/update-password.service.ts`

- [ ] Creer `__tests__/features/account/services/update-password.test.ts`
- [ ] **Mocks** : `@/lib/auth`, `@/lib/resend`, `next/headers`
- [ ] Tests :
  - Appelle auth.api.changePassword avec les bons params
  - Envoie email de confirmation PasswordChangedEmail
  - Propage les erreurs de auth.api.changePassword

#### 4g. `features/account/services/update-avatar.service.ts`

- [ ] Creer `__tests__/features/account/services/update-avatar.test.ts`
- [ ] **Mocks** : `prisma`, `@/lib/auth`, `@/lib/optimize`, `@/lib/r2`, `next/headers`
- [ ] Tests :
  - Optimise l'image (appelle optimizeAvatar)
  - Upload le fichier en R2 avec la bonne cle
  - Supprime l'ancien avatar si existant
  - Met a jour l'image dans la session (auth.api.updateUser)
  - Retourne avatarUrl et size
  - Ne supprime pas l'ancien avatar si image est null
  - Ne supprime pas si l'ancien path ne commence pas par "avatars"
  - Sanitize le userId dans le nom de fichier

#### 4h. `features/contact/services/create-contact.service.ts`

- [ ] Creer `__tests__/features/contact/services/create-contact.test.ts`
- [ ] **Mocks** : `@/lib/resend`, `@/lib/env`
- [ ] Tests :
  - Appelle sendEmail avec les bons params (from, to, replyTo, subject, react)
  - Utilise `[Contact]` dans le subject
  - Utilise RESEND_EMAIL_CONTACT comme destinataire
  - Utilise input.email comme replyTo

### Phase 5 : Tests API routes — P1

#### 5a. `app/api/stripe/webhooks/route.ts`

- [ ] Creer `__tests__/app/api/stripe/webhooks/route.test.ts`
- [ ] **Mocks** : `handleStripeWebhook`
- [ ] Tests :
  - Retourne 400 si signature manquante
  - Appelle handleStripeWebhook avec body et signature
  - Retourne le resultat de handleStripeWebhook

#### 5b. `app/api/stripe/checkout/route.ts`

- [ ] Creer `__tests__/app/api/stripe/checkout/route.test.ts`
- [ ] **Mocks** : `getSession`, `createCheckoutSession`, `handleApiError`
- [ ] Tests :
  - Retourne 401 si pas de session
  - Parse formData et valide avec Zod
  - Retourne 201 avec `{ url }` en cas de succes
  - Appelle handleApiError en cas d'erreur

#### 5c. `app/api/avatar/route.ts`

- [ ] Creer `__tests__/app/api/avatar/route.test.ts`
- [ ] **Mocks** : `getSession`, `checkRatelimit`, `updateAvatar`, `handleApiError`
- [ ] Tests :
  - Retourne 401 si pas de session
  - Verifie le rate limit
  - Parse formData et valide avec Zod
  - Retourne 201 avec resultat

### Phase 6 : Tests schemas manquants — P2

#### 6a. `features/account/schemas/avatar.schema.ts`

- [ ] Creer `__tests__/schemas/avatar.schema.test.ts`
- [ ] Tests :
  - Accepte fichier JPEG, PNG, WebP valide
  - Rejecte fichier vide (size === 0)
  - Rejecte fichier trop gros (> MAX_FILE_SIZE)
  - Rejecte format non supporte (gif, pdf, svg)
  - Rejecte non-File input

---

## 4. Objectifs mesurables

### Coverage cible

| Couche | Cible | Justification |
|--------|-------|---------------|
| **utils/** | **95%+** | Fonctions pures, aucune excuse |
| **lib/constants/** | **100%** | Exhaustivite des records |
| **lib/parsers/** | **95%+** | Premiere couche de validation |
| **lib/optimize.ts** | **90%+** | Traitement d'image sensible |
| **lib/r2.ts** | **85%+** | Operations cloud |
| **features/**/schemas/** | **100%** | Validation = premiere defense |
| **features/**/services/** | **85%+** | Business logic critique |
| **features/**/constants/** | **100%** | Enums exhaustifs |
| **app/api/** | **80%+** | Points d'entree HTTP |
| **Global** | **80%+** | Standard SaaS production |

### Fichiers a 100%

- Tous les `utils/` (errors, string, date, ratelimit)
- Tous les `schemas/` (validation)
- Tous les `constants/` (enums, labels)
- `lib/parsers/nuqs.ts`

### Flux a couvrir integralement

1. **Stripe Webhook** : signature → dedup → chaque event type → DB → cache → Sentry
2. **Suppression compte** : auth → confirmation → Stripe → R2 → DB → email
3. **Checkout** : auth → role → email verified → customer sync → no duplicate → session
4. **Upload avatar** : auth → ratelimit → validate → optimize → upload → delete old → update session

### Criteres "Production Ready"

- [ ] 0 tests en echec
- [ ] Coverage globale > 80%
- [ ] Tous les flux critiques couverts (webhook, delete account, checkout)
- [ ] Tous les schemas valides a 100%
- [ ] `pnpm test` passe en < 10s
- [ ] `pnpm typecheck` passe sans erreur
- [ ] `pnpm lint` passe sans erreur
- [ ] `pnpm build` passe sans erreur

---

## 5. Securisation production

### Checklist securite

#### Stripe Webhooks
- [ ] Verification de signature (`constructEvent`) — PRESENT dans le code
- [ ] Idempotence via Redis (dedup par event.id, TTL 24h) — PRESENT dans le code
- [ ] Retourner 200 meme en cas d'erreur interne (eviter les retries infinis) — PRESENT dans le code
- [ ] Sentry sur les erreurs internes — PRESENT dans le code
- [ ] Tester signatures invalides, events inconnus, events dupliques

#### Validation d'inputs
- [ ] Zod sur chaque schema — PRESENT
- [ ] `.trim()` sur tous les strings — PRESENT
- [ ] `.toLowerCase()` sur les emails — PRESENT
- [ ] Re-validation server-side dans les services (defense in depth) — PRESENT dans get-users
- [ ] `parseAsSafeSearch` tronque (ne rejette pas) — PRESENT

#### Auth
- [ ] `requireSession()` sur chaque page protegee — PRESENT
- [ ] `requireAdmin()` sur les pages admin — PRESENT
- [ ] `requireCustomerVerifiedEmail()` avant operations sensibles — PRESENT
- [ ] Rate limiting sur auth endpoints (better-auth config) — PRESENT (5/10s sign-in, 3/10s sign-up)
- [ ] Rate limiting sur actions (authenticated + contact) — PRESENT

#### Secrets
- [ ] `.env` dans `.gitignore` — PRESENT
- [ ] Validation des env vars via `@t3-oss/env-nextjs` + Zod — PRESENT
- [ ] Pas de secrets dans le code source — VERIFIE
- [ ] `STRIPE_WEBHOOK_SECRET` utilise pour verification — PRESENT

#### Error Boundaries
- [ ] `app/error.tsx` — PRESENT (erreur de page)
- [ ] `app/global-error.tsx` — PRESENT (erreur critique + Sentry)
- [ ] `handleApiError` — PRESENT (masque les erreurs en prod)
- [ ] `handleServerError` dans safe-action — PRESENT (masque les erreurs en prod)

#### Monitoring
- [ ] Sentry client (`sentry.client.config.ts`) — PRESENT
- [ ] Sentry server (`sentry.server.config.ts`) — PRESENT
- [ ] Sentry edge (`sentry.edge.config.ts`) — PRESENT
- [ ] `captureException` dans global-error et webhooks — PRESENT

#### Prisma
- [ ] `select` sur toutes les queries — VERIFIE dans les services
- [ ] `take` sur les `findMany` — PRESENT
- [ ] `$transaction` pour count + findMany — PRESENT dans get-users
- [ ] Pas d'injection SQL possible (Prisma parameterise) — PRESENT

#### Headers / CORS
- [ ] Pas de `Access-Control-Allow-Origin: *` — OK (Next.js par defaut)
- [ ] `robots: { index: false, follow: false }` sur pages protegees — PRESENT

---

## 6. CI/CD

### Pipeline minimal (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Lint (parallele)
      - run: pnpm lint

      # Typecheck (parallele)
      - run: pnpm typecheck

      # Tests + Coverage
      - run: pnpm test:coverage
        env:
          NODE_ENV: test

      # Coverage threshold check
      - name: Check coverage threshold
        run: |
          npx vitest run --coverage --coverage.thresholds.lines=80 \
            --coverage.thresholds.functions=80 \
            --coverage.thresholds.branches=75 \
            --coverage.thresholds.statements=80

      # Build
      - run: pnpm build
        env:
          # Fournir les env vars minimales pour le build
          SKIP_ENV_VALIDATION: true
```

### Regles de merge

- [ ] **Bloquer merge** si : tests en echec, coverage < 80%, lint errors, typecheck errors, build fail
- [ ] **Obligatoire** : au moins 1 approval sur les PRs
- [ ] **Recommande** : coverage diff check (ne pas baisser la coverage)

### Scripts package.json (deja presents)

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "typecheck": "tsc --noEmit",
  "lint": "eslint",
  "build": "prisma generate && next build"
}
```

### Ajouter au vitest.config.ts

```ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

---

## 7. Roadmap — Ordre d'execution optimal

### Semaine 1 : Fondations (CRITIQUE)

| # | Tache | Risque | Impact | Effort |
|---|-------|--------|--------|--------|
| 1 | Corriger le test `users-filters.constant` en echec | - | Debloquer CI | 5 min |
| 2 | Mettre a jour `vitest.config.ts` (coverage include features) | - | Visibilite | 10 min |
| 3 | Tests `handle-webhook.service.ts` | CRITIQUE | Paiements | 2-3h |
| 4 | Tests `delete-account.service.ts` | CRITIQUE | Donnees | 1-2h |
| 5 | Tests `create-checkout-session.service.ts` | ELEVE | Paiements | 1-2h |
| 6 | Tests `create-portal-session.service.ts` | ELEVE | Paiements | 30min |

### Semaine 2 : Services & utils

| # | Tache | Risque | Impact | Effort |
|---|-------|--------|--------|--------|
| 7 | Tests `get-action-result.ts` | MOYEN | Toutes les forms | 30min |
| 8 | Tests `get-error-message.ts` | MOYEN | Toutes les forms | 30min |
| 9 | Tests `lib/optimize.ts` | ELEVE | Upload | 1-2h |
| 10 | Tests `lib/r2.ts` | ELEVE | Storage | 1-2h |
| 11 | Tests `update-profile.service.ts` | MOYEN | Compte | 1h |
| 12 | Tests `update-password.service.ts` | MOYEN | Securite | 30min |
| 13 | Tests `update-avatar.service.ts` | MOYEN | Upload | 1h |
| 14 | Tests `create-contact.service.ts` | FAIBLE | Contact | 20min |

### Semaine 3 : API routes & finitions

| # | Tache | Risque | Impact | Effort |
|---|-------|--------|--------|--------|
| 15 | Tests API route webhooks | ELEVE | Entree HTTP | 30min |
| 16 | Tests API route checkout | MOYEN | Entree HTTP | 30min |
| 17 | Tests API route avatar | MOYEN | Entree HTTP | 30min |
| 18 | Tests `avatar.schema.ts` | FAIBLE | Validation | 20min |
| 19 | Tests constants (roles, sub-status, invoice, query) | FAIBLE | Exhaustivite | 30min |
| 20 | Configurer thresholds coverage dans vitest.config | - | CI/CD | 10min |
| 21 | Configurer CI/CD pipeline GitHub Actions | - | Automatisation | 30min |

### Post-deploiement (optionnel, phase 2)

| # | Tache | Justification |
|---|-------|---------------|
| 22 | Tests E2E avec Playwright (happy paths) | Tester les flux complets |
| 23 | Tests de charge sur rate limiting | Verifier les limites en conditions reelles |
| 24 | Tests de regression Stripe (webhook replay) | Securiser les mises a jour Stripe |
| 25 | Smoke tests post-deploy | Verifier que la prod fonctionne |

---

## Annexe : Setup des mocks communs

### Mock Prisma (pattern reutilisable)

```ts
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), delete: vi.fn(), update: vi.fn() },
    stripeCustomer: { findUnique: vi.fn(), create: vi.fn() },
    subscription: { upsert: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
```

### Mock Stripe

```ts
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    customers: { create: vi.fn(), update: vi.fn(), retrieve: vi.fn(), del: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    subscriptions: { list: vi.fn() },
    invoices: { list: vi.fn() },
  },
}));
```

### Mock Redis

```ts
vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));
```

### Mock Sentry

```ts
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
```

### Mock R2

```ts
vi.mock("@/lib/r2", () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getPublicUrl: vi.fn().mockReturnValue("https://r2.example.com/test"),
  fileExists: vi.fn(),
  getPrivateUrl: vi.fn(),
}));
```

### Mock Resend

```ts
vi.mock("@/lib/resend", () => ({
  sendEmail: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
  sendEmailSafe: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
}));
```

### Mock Auth

```ts
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn(),
    },
  },
}));
```

### Mock Next.js

```ts
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));
```
