# Configuration du Rate Limiting

Ce projet utilise une approche hybride pour le rate limiting :
- **Better Auth natif** pour les routes d'authentification (`/api/auth/*`)
- **Upstash Redis** pour les autres routes (formulaire de contact, routes protégées)

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```env
# Upstash Redis (pour /api/contact et routes protégées)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Comment obtenir ces valeurs

1. Créez un compte sur [Upstash](https://upstash.com/)
2. Créez une nouvelle base de données Redis (choisir la région la plus proche de vos utilisateurs)
3. Dans le dashboard de votre base Redis, copiez :
   - **REST URL** → `UPSTASH_REDIS_REST_URL`
   - **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

## Architecture du Rate Limiting

### 1. Better Auth natif (Database Storage)

**Routes protégées** : `/api/auth/*` (sign-in, sign-up, reset-password, etc.)

Configuration dans `lib/auth.ts` :

```typescript
rateLimit: {
  enabled: true,
  window: 60,        // 60 secondes
  max: 100,          // 100 requêtes max
  customRules: {
    "/sign-in/email": {
      window: 10,    // 10 secondes
      max: 5,        // 5 tentatives de connexion max
    },
    "/sign-up/email": {
      window: 10,
      max: 3,        // 3 créations de compte max
    },
    "/reset-password": {
      window: 60,
      max: 3,        // 3 demandes de reset max par minute
    },
  },
  storage: "database",  // Stockage en base pour multi-instances (Vercel)
}
```

**Avantages** :
- ✅ Intégré nativement à Better Auth
- ✅ Stockage en base PostgreSQL (Neon)
- ✅ Compatible multi-instances serverless (Vercel)
- ✅ Pas de service externe supplémentaire pour l'auth

**Table Prisma créée** : `rateLimit`

### 2. Upstash Redis (Routes non-auth)

**Routes protégées** :

#### `/api/contact` - Formulaire de contact public
- **Limite** : 5 requêtes par heure par IP
- **Raison** : Empêcher le spam
- **Identifier** : Adresse IP du client (ordre de priorité : `x-forwarded-for`, `cf-connecting-ip`, `x-real-ip`)
- **Développement** : Utilise l'identifier `dev-localhost` en local

#### Routes authentifiées : `/api/password`, `/api/profile`, `/api/avatar`
- **Limite** : 30 requêtes par minute par utilisateur
- **Identifier** : ID utilisateur (`session.user.id`)
- **Raison** : Limiter les abus d'utilisateurs authentifiés

## Ordre d'exécution (Important)

### Routes publiques (par IP)
Le rate limiting est vérifié **en premier** pour bloquer rapidement :

```typescript
async function POST(request: Request) {
  try {
    // 1. Rate limit par IP (bloque avant tout)
    const identifier = getRequestIdentifier(request);
    await checkRatelimit(contactRatelimit, identifier);

    // 2. Business logic
    // ...
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### Routes protégées (par user ID)
Le rate limiting vient **après** la vérification de session :

```typescript
async function PATCH(request: Request) {
  try {
    // 1. Vérification session (obligatoire pour identifier l'user)
    const session = await getSession();
    if (!session) throw new UnauthorizedError();

    // 2. Rate limit par user ID (maintenant qu'on a l'ID)
    await checkRatelimit(authenticatedRatelimit, session.user.id);

    // 3. Business logic
    // ...
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

**Pourquoi cet ordre ?**
- ✅ Routes publiques : bloque par IP avant de toucher la DB
- ✅ Routes protégées : nécessite la session pour identifier l'utilisateur
- ✅ Protection en profondeur adaptée au contexte

## Réponse en cas de dépassement

### Better Auth (routes /api/auth/*)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```
**Status Code** : `429 Too Many Requests`

### Upstash (autres routes)
```json
{
  "success": false,
  "type": "TooManyRequestsError",
  "message": "Trop de requêtes. Veuillez réessayer plus tard."
}
```
**Status Code** : `429 Too Many Requests`

## Fichiers créés

```
lib/
  ├── auth.ts                           # Configuration Better Auth avec rateLimit
  └── ratelimit.ts                      # Limiters Upstash (contact + authenticated)

utils/
  └── ratelimit/
      ├── check-ratelimit.ts            # Fonction helper pour vérifier le rate limit
      └── get-request-identifier.ts     # Extraction de l'IP client

prisma/schema.prisma                    # Model RateLimit ajouté
```

## Ajout de rate limiting à une nouvelle route

### Route publique (par IP) avec Upstash

```typescript
import { NextResponse } from "next/server";

import { contactRatelimit } from "@/lib/ratelimit";

import { handleApiError } from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";
import { getRequestIdentifier } from "@/utils/ratelimit/get-request-identifier";

async function POST(request: Request) {
  try {
    const identifier = getRequestIdentifier(request);
    await checkRatelimit(contactRatelimit, identifier);

    // Votre logique ici...

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { POST };
```

### Route protégée (par utilisateur) avec Upstash

```typescript
import { NextResponse } from "next/server";

import { authenticatedRatelimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

import {
  UnauthorizedError,
  handleApiError,
} from "@/utils/api/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      throw new UnauthorizedError("Vous devez être connecté");
    }

    await checkRatelimit(authenticatedRatelimit, session.user.id);

    // Votre logique ici...

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export { PATCH };
```

### Route d'authentification avec Better Auth

Aucune configuration nécessaire ! Better Auth gère automatiquement le rate limiting pour toutes les routes `/api/auth/*`.

Pour personnaliser :

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ...autres options
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/votre-nouvelle-route": {
        window: 30,
        max: 10,
      },
    },
    storage: "database",
  },
});
```

## Configuration personnalisée

### Modifier les limites Upstash

Éditez `lib/ratelimit.ts` :

```typescript
// Exemple : Changer la limite du formulaire de contact à 10 requêtes par heure
const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 au lieu de 5
  prefix: "@upstash/ratelimit/contact",
  analytics: true,
});
```

### Modifier les limites Better Auth

Éditez `lib/auth.ts` :

```typescript
rateLimit: {
  customRules: {
    "/sign-in/email": {
      window: 10,
      max: 10, // 10 tentatives au lieu de 5
    },
  },
}
```

## Monitoring

### Better Auth
- Les données de rate limit sont stockées dans la table `rateLimit` de PostgreSQL
- Consultez directement la base pour voir les statistiques

### Upstash
- Dashboard Upstash : [console.upstash.com](https://console.upstash.com)
- Analytics disponibles (activé avec `analytics: true`)
- Voir : nombre de requêtes, taux de blocage, performance

## Migration de la base de données

La table `rateLimit` a été ajoutée au schéma Prisma :

```prisma
model RateLimit {
  id        String   @id
  key       String
  count     Int      @default(0)
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([key])
  @@index([key, expiresAt])
  @@map("rateLimit")
}
```

Si vous avez besoin de régénérer :

```bash
npx prisma db push
```

## Environnement de développement

### Better Auth
Le rate limiting Better Auth est **désactivé en développement** par défaut.

### Upstash
Le rate limiting Upstash est **automatiquement désactivé** si les credentials ne sont pas configurés dans `.env`.

Vous verrez ce message dans les logs :
```
[Rate Limit] Upstash credentials not configured. Skipping rate limit check.
```

Pour activer le rate limiting Upstash en développement, ajoutez simplement vos credentials Upstash dans `.env`.

Pour forcer la désactivation même avec des credentials, modifiez `utils/ratelimit/check-ratelimit.ts` :

```typescript
async function checkRatelimit(
  ratelimiter: Ratelimit,
  identifier: string
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    return; // Désactiver en développement
  }

  const { success } = await ratelimiter.limit(identifier);

  if (!success) {
    throw new TooManyRequestsError(
      "Trop de requêtes. Veuillez réessayer plus tard."
    );
  }
}
```

⚠️ **Note** : Il est recommandé de garder le rate limiting actif en développement pour tester le comportement réel.

## Récapitulatif des limites

| Route | Méthode | Limite | Fenêtre | Identifier | Service |
|-------|---------|--------|---------|------------|---------|
| `/api/auth/*` | Toutes | 100 | 60s | IP | Better Auth |
| `/api/auth/sign-in/email` | POST | 5 | 10s | IP | Better Auth |
| `/api/auth/sign-up/email` | POST | 3 | 10s | IP | Better Auth |
| `/api/auth/reset-password` | POST | 3 | 60s | IP | Better Auth |
| `/api/contact` | POST | 5 | 1h | IP | Upstash |
| `/api/password` | PATCH | 30 | 1min | User ID | Upstash |
| `/api/profile` | PATCH | 30 | 1min | User ID | Upstash |
| `/api/avatar` | POST | 30 | 1min | User ID | Upstash |

## Pourquoi cette architecture hybride ?

1. **Better Auth natif pour l'auth** :
   - Déjà intégré, aucune dépendance supplémentaire
   - Stockage en base (compatible Vercel serverless)
   - Configuration centralisée dans `lib/auth.ts`

2. **Upstash pour le reste** :
   - Ultra-rapide (Redis)
   - Flexible pour routes custom
   - Analytics intégré
   - Optimal pour rate limiting par IP (formulaire contact)

Cette approche évite la redondance tout en maximisant les fonctionnalités natives de chaque service.

## Détection de l'IP client

### Headers vérifiés (par ordre de priorité)

1. **`x-forwarded-for`** : Standard pour proxies/load balancers (Vercel, Nginx, etc.)
2. **`cf-connecting-ip`** : Cloudflare (si utilisé comme CDN)
3. **`x-real-ip`** : Certains proxies Nginx

### Fallbacks

- **Développement** : Utilise `dev-localhost` automatiquement
- **Production sans headers** : Utilise `unknown` avec un warning dans les logs

### ⚠️ Warning important

Si vous voyez ce message dans les logs en production :

```
[Rate Limit] Unable to determine client IP. Using fallback identifier 'unknown'.
This may cause all users to share the same rate limit.
```

**Cela signifie** : Votre reverse proxy ne passe pas les headers d'IP correctement. Tous les utilisateurs partageront la même limite !

**Solutions** :
1. **Vercel** : Les headers sont automatiquement passés, ce warning ne devrait jamais apparaître
2. **Cloudflare** : Vérifier que `cf-connecting-ip` est bien transmis
3. **Autre proxy** : Configurer pour passer `x-forwarded-for` ou `x-real-ip`

### Test en local

En développement, l'identifier sera toujours `dev-localhost`, donc tous les tests locaux partageront la même limite. C'est normal et attendu.
