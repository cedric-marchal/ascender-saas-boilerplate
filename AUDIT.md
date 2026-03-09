# Audit de sécurité & production — Ascender SaaS Boilerplate

> Revue effectuée par un senior developer. Coche chaque étape au fur et à mesure des corrections.

---

## Résumé

Architecture solide pour du SaaS 15–50 utilisateurs. Les problèmes trouvés touchent principalement l'infrastructure serverless, la configuration explicite de la sécurité, et la fiabilité opérationnelle. Aucune réécriture architecturale n'est nécessaire.

**18 points identifiés — 2 Critiques · 4 Hauts · 6 Moyens · 6 Faibles**

---

## Phase 1 — Bloquants (avant premier client)

### F1 · CRITIQUE — Prisma : épuisement des connexions sur Vercel

**Fichier :** `lib/prisma.ts`

**Problème :** `PrismaPg` utilise un pool TCP (`pg`) avec 10 connexions par défaut. Sur Vercel (Lambda), chaque cold start crée un nouveau pool. Avec l'autoscaling, plusieurs instances simultanées épuisent rapidement les connexions Neon.

**Correction :** Remplacer `@prisma/adapter-pg` par le driver HTTP Neon (`@neondatabase/serverless`) qui n'utilise pas de connexions persistantes.

```ts
// lib/prisma.ts
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const sql = neon(env.DATABASE_URL);
const adapter = new PrismaNeon(sql);

export const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });
```

```bash
pnpm add @neondatabase/serverless @prisma/adapter-neon
pnpm remove @prisma/adapter-pg pg
```

Référence : [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)

- [x] Remplacer l'adapter dans `lib/prisma.ts`
- [x] Mettre à jour `package.json` (add neon, remove pg)
- [x] Retirer `pg` de `serverExternalPackages` dans `next.config.ts`
- [ ] Tester la connexion en local (`pnpm dev`)

---

### F2 · CRITIQUE — Webhook Stripe : retourne 200 même en cas d'erreur transitoire

**Fichier :** `features/billing/services/stripe/handle-webhook.service.ts`

**Problème :** Le handler retourne HTTP 200 sur toutes les erreurs (pattern "graceful degradation"). Si la DB est indisponible pendant un webhook `subscription.updated`, Stripe considère l'événement comme traité et **ne retentera pas**. La facturation est définitivement désynchronisée.

**Correction :** Retourner 5xx pour les erreurs transitoires (DB, Redis) afin que Stripe relance l'événement.

```ts
// Dans handleStripeWebhook
try {
  await processEvent(event);
  return { status: 200, message: "OK" };
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError || error instanceof PrismaClientInitializationError) {
    // Erreur transitoire → Stripe va retenter
    captureException(error);
    return { status: 503, message: "Service temporairement indisponible" };
  }
  // Erreur non-transitoire → 200 pour éviter les retry infinis
  captureException(error);
  return { status: 200, message: "Traité avec erreurs" };
}
```

- [x] Différencier erreurs Prisma transitoires vs définitives
- [x] Retourner 503 pour `PrismaClientInitializationError` et `PrismaClientRustPanicError`
- [x] Vérifier que les autres cas (event déjà traité, user introuvable) restent à 200
- [ ] Tester avec Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhooks`

---

### F3 · HAUT — BetterAuth : attributs des cookies de session non explicites

**Fichier :** `lib/auth.ts`

**Problème :** `httpOnly`, `secure`, `sameSite` ne sont pas configurés explicitement. On dépend des valeurs par défaut non documentées de BetterAuth — une mise à jour mineure pourrait les changer silencieusement.

**Correction :**

```ts
// lib/auth.ts
advanced: {
  cookiePrefix: "saas",
  cookies: {
    sessionToken: {
      attributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 jours
      },
    },
  },
},
```

- [x] Ajouter le bloc `advanced.defaultCookieAttributes` dans `lib/auth.ts`
- [ ] Vérifier que les cookies sont bien `httpOnly` en production (DevTools → Application → Cookies)

---

### F4 · HAUT — BetterAuth : `trustedOrigins` manquant

**Fichier :** `lib/auth.ts`

**Problème :** Sans `trustedOrigins`, l'API BetterAuth accepte les requêtes de n'importe quelle origine, affaiblissant la protection CSRF.

**Correction :**

```ts
// lib/auth.ts
trustedOrigins: [env.NEXT_PUBLIC_BASE_URL],
```

- [x] Ajouter `trustedOrigins` dans `lib/auth.ts`
- [ ] Vérifier que les requêtes de domaines tiers sont refusées (401)

---

### F5 · HAUT — `proxy.ts` vs `middleware.ts` : sécurité peut-être inactive sur Vercel

**Fichier :** `proxy.ts`

**Problème :** Les headers de sécurité (CSP, HSTS, X-Frame-Options) et la vérification d'auth sont dans `proxy.ts`, pas dans `middleware.ts`. Sur Vercel Edge Runtime, seul `middleware.ts` à la racine est automatiquement exécuté. Si `proxy.ts` n'est pas correctement branché, ces protections **ne s'appliquent pas**.

**Vérification :**
1. Confirmer qu'un fichier `middleware.ts` existe ou que `proxy.ts` est exporté comme middleware
2. Tester en production : les headers `X-Frame-Options` et `Content-Security-Policy` doivent être présents dans les réponses

- [x] Vérifier l'existence de `middleware.ts` à la racine du projet
- [ ] Déployer sur Vercel preview et inspecter les headers de réponse (`curl -I https://...`)
- [ ] Confirmer que `/dashboard` sans session redirige bien vers `/connexion`

---

## Phase 2 — Avant le lancement (haute valeur)

### F6 · HAUT — Google OAuth : utilisateurs potentiellement marqués non-vérifiés

**Fichier :** `lib/auth.ts`

**Problème :** L'email est déjà vérifié par Google, mais BetterAuth peut ne pas marquer automatiquement `emailVerified: true`. Ces utilisateurs seront bloqués par `requireCustomerVerifiedEmail()`.

**Vérification :**
1. Créer un compte via Google OAuth
2. Vérifier dans la DB : `SELECT "emailVerified" FROM "user" WHERE email = '...'`
3. Accéder à une route protégée par `requireCustomerVerifiedEmail`

**Correction si nécessaire :**

```ts
// lib/auth.ts — dans socialProviders.google ou dans un hook
user: {
  fields: {
    emailVerified: { type: "boolean", defaultValue: false },
  },
  // Ou via emailVerification.autoSignInAfterVerification
},
```

- [ ] Tester le flow Google OAuth → accès à `/dashboard/facturation`
- [ ] Confirmer que `emailVerified = true` après OAuth Google
- [ ] Ajouter un hook `user.create.after` si nécessaire pour forcer `emailVerified: true` pour OAuth

---

### F7 · MOYEN — BetterAuth rate limiting : utilise PostgreSQL au lieu de Redis

**Fichier :** `lib/auth.ts:32-55`

**Problème :** `storage: "database"` fait une écriture Prisma sur chaque tentative d'auth (sign-in, sign-up, reset). Sur Neon serverless, ça ajoute 20–50ms par requête auth. Upstash Redis est déjà configuré dans le projet.

**Correction :** Configurer BetterAuth pour utiliser Redis comme storage de rate limiting. Consulter la [doc BetterAuth rate limiting](https://www.better-auth.com/docs/concepts/rate-limit) pour la configuration du custom storage.

- [ ] Remplacer `storage: "database"` par le storage Redis BetterAuth
- [ ] Mesurer la latence de sign-in avant/après (objectif : < 200ms total)

---

### F8 · MOYEN — Sync email Stripe : erreur silencieuse non capturée par Sentry

**Fichier :** `lib/auth.ts:118-123`

**Problème :** Quand la mise à jour de l'email Stripe échoue dans `afterEmailVerification`, l'erreur est seulement `console.error`. Elle n'est pas envoyée à Sentry. L'email du client Stripe reste désynchronisé sans alerte.

**Correction :**

```ts
// lib/auth.ts — dans afterEmailVerification
} catch (error: unknown) {
  console.error("Stripe email sync failed:", error);
  captureException(error, {
    tags: { userId: user.id, context: "stripe-email-sync" },
  });
}
```

- [ ] Importer `captureException` de `@sentry/nextjs`
- [ ] Ajouter `captureException` dans le catch de la sync Stripe

---

### F9 · MOYEN — Tables `session`, `verification`, `rateLimit` : croissance non bornée

**Fichier :** Manquant — `app/api/cron/cleanup/route.ts`

**Problème :** Vercel n'a pas de processus persistant. Les lignes expirées dans `session`, `verification`, et `rateLimit` s'accumulent indéfiniment. Sur Neon Free, le stockage est limité.

**Correction :** Créer un endpoint cron et l'appeler quotidiennement via Vercel Cron.

```ts
// app/api/cron/cleanup/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [sessions, verifications, rateLimits] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  return NextResponse.json({
    deleted: {
      sessions: sessions.count,
      verifications: verifications.count,
      rateLimits: rateLimits.count,
    },
  });
}

export { GET };
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- [ ] Créer `app/api/cron/cleanup/route.ts`
- [ ] Créer `vercel.json` avec la configuration du cron
- [ ] Ajouter `CRON_SECRET` dans les variables d'environnement Vercel
- [ ] Vérifier que le cron s'exécute dans les logs Vercel

---

### F10 · MOYEN — Session cache 5 min : propagation lente des changements de rôle

**Fichier :** `lib/auth.ts:27-31`

**Problème :** Avec `cookieCache.maxAge: 300`, un changement de rôle (ex: révoquer un admin) prend jusqu'à 5 minutes pour être effectif. Sur un SaaS à faible volume, c'est un risque opérationnel réel.

**Options :**
- Réduire à 60 secondes : `maxAge: 60`
- Ou implémenter une invalidation explicite en appelant `auth.api.revokeSession()` lors des changements de rôle admin

- [ ] Décider de la stratégie (réduction délai ou invalidation explicite)
- [ ] Appliquer la correction dans `lib/auth.ts`

---

## Phase 3 — Solidité du boilerplate

### F11 · MOYEN — Checkout/Portal Stripe : pas de clés d'idempotence

**Fichiers :** `features/billing/services/stripe/create-checkout-session.service.ts`, `create-portal-session.service.ts`

**Problème :** Sans clé d'idempotence, un timeout réseau + retry client peut créer plusieurs sessions de checkout pour le même utilisateur.

**Correction :**

```ts
// create-checkout-session.service.ts
const session = await stripe.checkout.sessions.create(
  {
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${env.NEXT_PUBLIC_BASE_URL}/dashboard/facturation?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/tarifs?canceled=true`,
    metadata: { userId },
  },
  {
    idempotencyKey: `checkout-${userId}-${priceId}`,
  },
);
```

- [ ] Ajouter `idempotencyKey` dans `create-checkout-session.service.ts`
- [ ] Ajouter `idempotencyKey` dans `create-portal-session.service.ts`

---

### F12 · MOYEN — Account linking : doublons possibles avec Google OAuth + email/password

**Fichier :** `lib/auth.ts`

**Problème :** Un utilisateur qui s'inscrit avec Google puis essaie de se connecter avec email/password (même email) peut avoir deux comptes distincts.

**Correction :**

```ts
// lib/auth.ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google"],
  },
},
```

- [ ] Ajouter la configuration `account.accountLinking` dans `lib/auth.ts`
- [ ] Tester le scénario : inscription Google → tentative connexion email/password avec même email

---

### F13 · MOYEN — Statuts Pro hardcodés inline

**Fichier :** `lib/session.ts:108` — `["active", "trialing", "past_due"]`

**Problème :** Règle métier cachée dans une fonction d'infrastructure. Si on change la politique (ex: supprimer `past_due`), il faut chercher dans `lib/session.ts`.

**Correction :** Utiliser la constante déjà prévue dans `features/billing/constants/subscription-status.constant.ts` :

```ts
// features/billing/constants/subscription-status.constant.ts
const PRO_ACCESS_STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due"];

export { PRO_ACCESS_STATUSES };
```

```ts
// lib/session.ts
import { PRO_ACCESS_STATUSES } from "@/features/billing/constants/subscription-status.constant";

// Remplacer le tableau inline par PRO_ACCESS_STATUSES
```

- [ ] Ajouter `PRO_ACCESS_STATUSES` dans `subscription-status.constant.ts`
- [ ] Importer et utiliser dans `lib/session.ts`

---

### F14 · FAIBLE — Suppression du client Stripe à la suppression de compte

**Fichier :** `features/account/services/delete-account.service.ts` (à vérifier)

**Problème :** Si `stripe.customers.del()` n'est pas appelé lors de la suppression de compte, des clients Stripe orphelins s'accumulent.

**Vérification :**
1. Lire `features/account/services/delete-account.service.ts`
2. Confirmer la présence de `stripe.customers.del(stripeCustomerId)`

- [ ] Vérifier que `delete-account.service.ts` supprime le client Stripe
- [ ] Ajouter l'appel si absent

---

### F15 · FAIBLE — Génération de slug : collision possible

**Fichier :** `lib/auth.ts:170-177`

**Problème :** Le slug est généré avec `slugify(name) + timestamp + random`. Deux inscriptions simultanées avec le même nom à la même milliseconde provoquent une erreur de contrainte unique Prisma non gérée.

**Correction :** Utiliser un `nanoid` ou `crypto.randomUUID()` comme suffixe garanti unique :

```ts
// lib/auth.ts — hook user.create.before
const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 8)}`;
```

- [ ] Remplacer la génération de slug par une approche collision-safe

---

### F16 · FAIBLE — Invalidation cache sur `invoice.created` : trop précoce

**Fichier :** `features/billing/services/stripe/handle-webhook.service.ts:178-218`

**Problème :** `invoice.created` se déclenche avant que la facture soit finalisée. L'invalidation cache à ce stade peut afficher une liste vide.

**Correction :** N'invalider le cache que sur `invoice.payment_succeeded` et `invoice.payment_failed`.

- [ ] Retirer `invoice.created` et `invoice.updated` de la liste des événements qui invalident le cache
- [ ] Conserver uniquement `invoice.payment_succeeded` et `invoice.payment_failed`
- [ ] Mettre à jour la liste des événements dans le dashboard Stripe pour ne plus envoyer `invoice.created` et `invoice.updated`

---

### F17 · FAIBLE — Un seul plan Stripe supporté

**Fichiers :** `lib/session.ts`, `create-checkout-session.service.ts`

**Problème :** `STRIPE_PRICE_ID_PRO` est la seule clé de plan. Les clients avec tarification par paliers (Basic/Pro/Enterprise) nécessiteront une refactorisation.

**Suggestion :** Documenter cette limite dans le README et prévoir un objet de config extensible :

```ts
// lib/env.ts — extensible pour des plans futurs
// STRIPE_PRICE_ID_PRO déjà présent
// Ajouter STRIPE_PRICE_ID_ENTERPRISE si besoin
```

- [ ] Documenter la limite dans ce fichier / le README du projet
- [ ] Identifier tous les endroits qui référencent `STRIPE_PRICE_ID_PRO` pour planifier l'extension

---

### F18 · FAIBLE — Pas de `vercel.json`

**Problème :** Pas de template de configuration Vercel. Les clients n'ont aucun point de départ pour les crons, les timeouts de fonctions, ou la configuration régionale.

**Correction :**

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ],
  "functions": {
    "app/api/stripe/webhooks/route.ts": {
      "maxDuration": 30
    }
  }
}
```

- [ ] Créer `vercel.json` à la racine (fait en partie via F9)
- [ ] Configurer `maxDuration: 30` pour le webhook Stripe

---

## Récapitulatif

| # | Sévérité | Fichier | Statut |
|---|----------|---------|--------|
| F1 | 🔴 CRITIQUE | `lib/prisma.ts` | [x] |
| F2 | 🔴 CRITIQUE | `handle-webhook.service.ts` | [x] |
| F3 | 🟠 HAUT | `lib/auth.ts` | [x] |
| F4 | 🟠 HAUT | `lib/auth.ts` | [x] |
| F5 | 🟠 HAUT | `middleware.ts` (créé) | [x] |
| F6 | 🟠 HAUT | `lib/auth.ts` | [ ] |
| F7 | 🟡 MOYEN | `lib/auth.ts` | [ ] |
| F8 | 🟡 MOYEN | `lib/auth.ts` | [ ] |
| F9 | 🟡 MOYEN | Manquant | [ ] |
| F10 | 🟡 MOYEN | `lib/auth.ts` | [ ] |
| F11 | 🟡 MOYEN | `create-checkout-session.service.ts` | [ ] |
| F12 | 🟡 MOYEN | `lib/auth.ts` | [ ] |
| F13 | 🟡 MOYEN | `lib/session.ts` | [ ] |
| F14 | 🔵 FAIBLE | `delete-account.service.ts` | [ ] |
| F15 | 🔵 FAIBLE | `lib/auth.ts` | [ ] |
| F16 | 🔵 FAIBLE | `handle-webhook.service.ts` | [ ] |
| F17 | 🔵 FAIBLE | `lib/session.ts` | [ ] |
| F18 | 🔵 FAIBLE | Manquant (`vercel.json`) | [ ] |

---

## Points forts à conserver

- Architecture feature-based bien séparée
- Prévention IDOR avec `userId` + `UserRole` enum dans tous les services
- Validation Zod à chaque couche (parsers → schemas → services)
- CSP nonce dynamique dans `proxy.ts`
- Idempotence Redis pour les webhooks Stripe
- `serverExternalPackages` dans `next.config.ts` pour éviter le bundle côté client
- Gestion d'erreurs structurée avec classes `AppError` et `handleApiError`
- Rate limiting Upstash multicouche (global IP + par action)
