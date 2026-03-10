# Rapport d'audit de modernisation

**Projet** : Ascender SaaS Boilerplate
**Date** : 10 mars 2026
**Type** : Audit complet — JavaScript/TypeScript/React/Next.js

---

## Résumé exécutif

Le projet est construit sur une stack **bleeding-edge** cohérente et bien maîtrisée. L'architecture feature-based, la discipline TypeScript et les conventions de code sont au-dessus de la moyenne de l'écosystème. Un bug critique a été identifié : le fichier `proxy.ts` (middleware de sécurité) n'est **pas exécuté par Next.js** faute d'un fichier `middleware.ts` à la racine. En dehors de ce point, les corrections restantes relèvent du polish et de l'automatisation DX.

**Score global : 8,5 / 10**

---

## Stack technique

| Couche | Technologie | Version | Statut |
|---|---|---|---|
| Framework | Next.js | 16.1.1 | ✅ Dernière version |
| Runtime | React | 19.2.3 | ✅ Dernière version |
| Langage | TypeScript | 5.9.3 | ✅ Dernière version |
| Style | Tailwind CSS | 4.2.1 | ✅ v4 (CSS-based) |
| ORM | Prisma | 7.4.2 | ✅ Dernière version |
| Auth | Better Auth | 1.5.4 | ✅ Dernière version |
| Paiements | Stripe SDK | 20.4.1 | ✅ Dernière version |
| Validation | Zod | 4.3.6 | ✅ v4 |
| Formulaires | TanStack Form | 1.28.4 | ✅ Dernière version |
| Tables | TanStack Table | 8.21.3 | ✅ Dernière version |
| Actions serveur | next-safe-action | 8.1.8 | ✅ Dernière version |
| État URL | nuqs | 2.8.9 | ✅ Dernière version |
| Monitoring | Sentry | 10.42.0 | ✅ Dernière version |
| Email | React Email + Resend | 1.0.8 / 6.9.3 | ✅ Dernière version |
| Rate limiting | Upstash Redis | 2.0.8 | ✅ Dernière version |
| Client HTTP | up-fetch | 2.6.0 | ✅ Dernière version |
| Images | sharp | 0.34.5 | ✅ Dernière version |
| Stockage | AWS SDK v3 | 3.1005.0 | ✅ v3 (moderne) |
| Tests | Vitest | 4.0.18 | ✅ Dernière version |
| Gestionnaire de paquets | pnpm | 10.x | ✅ Moderne |

Toutes les dépendances majeures sont à leur dernière version majeure. Aucune migration urgente requise.

---

## Architecture du dépôt

```
ascender-saas-boilerplate/
├── app/                    # Routes uniquement — thin shims
│   ├── (public)/           # Pages publiques (home, auth, légal, tarifs)
│   ├── (protected)/        # Pages protégées (dashboard, admin)
│   └── api/                # Handlers HTTP (avatar, stripe, cron, auth)
├── features/               # Toute la logique métier, par domaine
│   ├── account/            # Profil, avatar, mot de passe, suppression
│   ├── admin/              # Dashboard admin, gestion des utilisateurs
│   ├── auth/               # Connexion, inscription, réinitialisation
│   ├── billing/            # Abonnements Stripe, factures
│   ├── contact/            # Formulaire de contact + email
│   ├── cookie-consent/     # Bandeau RGPD + Google Analytics
│   ├── dashboard/          # Page d'accueil du dashboard
│   ├── home/               # Landing page
│   ├── legal/              # Pages légales (RGPD)
│   ├── pricing/            # Page des tarifs
│   └── users/              # Liste des utilisateurs (admin)
├── components/             # UI partagée
│   ├── ui/                 # Composants Shadcn/ui
│   ├── pages/              # Pages globales (error, not-found, sitemap)
│   ├── public/             # Header, footer
│   └── protected/          # Sidebars
├── lib/                    # Infrastructure (auth, prisma, stripe, redis, env)
├── utils/                  # Utilitaires purs (errors, dates, strings, ratelimit)
├── hooks/                  # Hooks partagés
├── prisma/                 # Schéma + migrations
└── __tests__/              # Suite de tests Vitest
```

L'architecture feature-based est correctement appliquée. `app/` ne contient que les préoccupations Next.js (metadata, auth guards, fonctions de route). Tout le JSX, la logique métier et les schémas de validation vivent dans `features/`. La hiérarchie Source of Truth (Prisma → lib/ → features/constants/ → features/schemas/ → features/services/ → features/actions/ → app/) est respectée de bout en bout.

---

## Évaluation de la modernité

### TypeScript : Excellent (9,5/10)

- `strict: true` activé
- `noUncheckedIndexedAccess: true` — détecte les accès aux tableaux non vérifiés
- `noImplicitReturns: true` — force les chemins de retour complets
- `verbatimModuleSyntax: true` — garantit que les imports de type restent des imports de type
- `moduleResolution: "bundler"` — correct pour un environnement Next.js + bundler
- `@total-typescript/ts-reset` — corrige les typages cassés de la stdlib TypeScript

**Zéro `any` en code de production.** 100 % de `catch (error: unknown)`. Tous les callbacks sont typés explicitement. Tous les gestionnaires d'événements sont typés (`ChangeEvent<HTMLInputElement>`, etc.). Zéro enum TypeScript natif — le projet utilise correctement les tableaux `const as const` et les enums générés par Prisma.

Seul point faible : `target: "ES2017"` dans `tsconfig.json`. ES2017 a 8 ans. Un passage à `"ES2022"` débloque `Error.cause`, `Object.hasOwn()`, `at()` et les champs de classe au niveau des types — tous déjà supportés par Node.js LTS et les navigateurs modernes.

### React : Excellent (9/10)

Les Server Components sont la valeur par défaut — `"use client"` est appliqué chirurgicalement (~30 % des fichiers composants). Pas de rendu côté client inutile. Pas de SWR ni de React Query — tout le data fetching est server-first. L'état URL est géré via nuqs plutôt que `useState` + synchronisation manuelle. Pas de Zustand/Redux/Jotai — l'état global est remplacé par l'état URL et React Context quand c'est vraiment nécessaire (sidebar uniquement).

L'usage de `useEffect` est minimal et intentionnel : capture d'erreurs Sentry dans les error boundaries. Pas de boucles d'effets, pas de `[]` qui cachent des closures périmées.

### Next.js App Router : Excellent (9/10)

Adoption complète du App Router. Le pattern thin shim est appliqué de façon cohérente. Les états de chargement utilisent `loading.tsx` (Suspense automatique de Next.js) plutôt que des wrappers `<Suspense>` manuels — c'est idiomatique. Les métadonnées sont exportées depuis les fichiers de route avec les champs `openGraph`, `twitter` et `robots` appropriés.

### Tailwind CSS : Excellent (9/10)

Tailwind v4 avec configuration CSS-based — pas de `tailwind.config.js`. Les tokens de design utilisent l'espace colorimétrique OKLCH (moderne, perceptuellement uniforme). Le bloc `@theme inline` mappe les variables CSS aux utilitaires Tailwind. `cn()` (clsx + tailwind-merge) est utilisé systématiquement pour la fusion conditionnelle de classes. `prettier-plugin-tailwindcss` impose l'ordre des classes automatiquement.

---

## Problèmes identifiés

### 🔴 Critique — `proxy.ts` n'est pas exécuté comme middleware

**Fichier** : `proxy.ts` (racine du projet)

`proxy.ts` exporte une fonction `proxy` et un objet `config`. Il implémente :

- Content Security Policy (CSP) avec nonce
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `Referrer-Policy`, `Permissions-Policy`
- Vérification de session → redirection vers `/connexion`
- Mode maintenance → redirection vers `/maintenance`

**Le problème** : Next.js exige que le middleware se trouve dans un fichier nommé `middleware.ts` à la racine du projet. Ce fichier **n'existe pas**. `proxy.ts` n'est importé par **aucun autre fichier**.

Conséquences :
- Les headers de sécurité (HSTS, CSP, X-Frame-Options, etc.) **ne sont envoyés sur aucune réponse**
- La protection au niveau middleware pour `/dashboard` et `/admin` **ne fonctionne pas**
- Le mode maintenance est **non fonctionnel**

La protection reste effective au niveau des pages (les guards `requireSession()`, `requireAdmin()`, etc. fonctionnent côté serveur), mais la couche middleware est entièrement inactive.

**Correction** : créer `middleware.ts` à la racine du projet (1 ligne) :

```typescript
export { proxy as middleware, config } from "@/proxy";
```

---

### 🟠 Important — Propagation du nonce CSP incomplète

**Fichier** : `proxy.ts:22-35` (conditionnel à la correction F1)

Le middleware génère un nonce et le transmet via l'en-tête `x-nonce`. C'est le pattern recommandé par Next.js 15+. Cependant, aucun composant dans le projet ne lit actuellement cet en-tête pour l'appliquer aux balises `<Script>`. Une fois le middleware activé, les scripts inline de Next.js (hydratation) pourraient être bloqués par la directive `script-src 'nonce-...'` du CSP.

Pour que le CSP avec nonce fonctionne correctement après activation du middleware, il faut lire le nonce dans le layout racine :

```typescript
// app/layout.tsx
import { headers } from "next/headers";

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  // passer le nonce aux composants Script si nécessaire
}
```

---

### 🟠 Important — Dépendance `zustand` inutilisée

**Fichier** : `package.json`

`zustand: ^5.0.11` est listé dans `dependencies` mais n'est jamais importé en code de production. La seule mention est dans un commentaire de `features/cookie-consent/components/google-analytics.tsx`.

**Correction** :

```bash
pnpm remove zustand
```

---

### 🟡 Moyen — ESLint ne bloque pas les warnings en CI

**Fichier** : `.github/workflows/ci.yml`

La tâche lint exécute `pnpm lint` → `eslint` sans flags. ESLint sort avec le code `0` même en présence de warnings. Plusieurs `console.log` dans `handle-webhook.service.ts` déclenchent la règle `no-console: warn` à chaque run, mais la CI passe.

**Correction** dans `package.json` :

```json
"lint": "eslint --max-warnings 0"
```

---

### 🟡 Moyen — Aucun hook pre-commit

Le projet n'a pas de configuration Husky ni lint-staged. N'importe quel développeur peut committer du code non formaté ou qui échoue au lint, sans blocage automatique.

**Correction** :

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

`.husky/pre-commit` :

```bash
pnpm exec lint-staged
```

`package.json` :

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write"
  ],
  "*.{json,md,css,yaml,yml}": [
    "prettier --write"
  ]
}
```

---

### 🟢 Mineur — `tsconfig.json` cible ES2017

`"target": "ES2017"` est vieux de 8 ans. Passage recommandé à `"ES2022"` pour aligner les sémantiques TypeScript avec les capacités réelles de Node.js LTS et des navigateurs modernes.

```json
"target": "ES2022"
```

---

### 🟢 Mineur — `console.log` dans le webhook Stripe

**Fichier** : `features/billing/services/stripe/handle-webhook.service.ts` (lignes ~217, 223, 238)

Plusieurs `console.log` pour le logging des événements webhook. La règle ESLint `no-console` autorise `console.warn` et `console.error` mais avertit sur `console.log`.

**Correction** : remplacer par `console.info` (non bloqué par la règle).

---

### 🟢 Mineur — `react-doctor.config.json` orphelin

**Fichier** : `react-doctor.config.json`

Fichier de configuration pour `react-doctor`, un outil qui n'est pas dans les `devDependencies`. Config orpheline d'un outil supprimé. **Correction** : supprimer le fichier.

---

### 🟢 Mineur — Code commenté dans `app/sitemap.ts`

**Fichier** : `app/sitemap.ts:94-126`

29 lignes de code exemple commenté pour les entrées de sitemap dynamiques. Acceptable dans un boilerplate, mais ajoute du bruit.

---

## Tableau récapitulatif des findings

| ID | Sévérité | Catégorie | Emplacement | Problème |
|----|----------|-----------|-------------|----------|
| F1 | 🔴 Critique | Sécurité | `proxy.ts` | Middleware non exécuté — tous les headers de sécurité inactifs |
| F2 | 🟠 Important | Sécurité | `proxy.ts:22-35` | Nonce CSP non propagé aux composants — à implémenter lors de F1 |
| F3 | 🟠 Important | Dépendances | `package.json` | `zustand` dans les dépendances mais jamais importé |
| F4 | 🟡 Moyen | Outillage | `ci.yml` | `--max-warnings 0` manquant — warnings ESLint passent en CI |
| F5 | 🟡 Moyen | Outillage | (absent) | Pas de Husky + lint-staged — pas de gate qualité pre-commit |
| F6 | 🟢 Mineur | TypeScript | `tsconfig.json` | `target: "ES2017"` — devrait être ES2022 *(corrigé)* |
| F7 | 🟢 Mineur | Code | `handle-webhook.service.ts` | `console.log` → devrait être `console.info` |
| F8 | 🟢 Mineur | Code | `react-doctor.config.json` | Config orpheline d'un outil non installé |
| F9 | 🟢 Mineur | Code | `app/sitemap.ts` | Code template commenté (29 lignes) |

---

## Points forts

La codebase présente un niveau de discipline rare dans l'écosystème JavaScript :

- **Zéro `any` en production** — aucune exception constatée sur l'ensemble des fichiers
- **`catch (error: unknown)` systématique** — 100 % des handlers d'erreur
- **Exports nommés partout** — zéro `export default` dans les composants features
- **Séparation Server/Client correcte** — ~70 % Server Components, `"use client"` appliqué chirurgicalement
- **Pattern IDOR prevention** — `UserRole` au lieu de booléens, `UNRESTRICTED_ROLES`, filtrage `userId` systématique
- **Requêtes Prisma robustes** — `select` sur tous les `findMany`, `take` toujours présent, `$transaction` pour les requêtes parallèles
- **Architecture cohérente** — thin shim dans `app/`, logique dans `features/`, hiérarchie de dépendances respectée
- **Validation multi-niveaux** — parsers nuqs → schémas Zod → re-validation serveur → requêtes Prisma paramétrées
- **Rate limiting en entrée** — aux pages et actions, jamais dans les services
- **Stack authentiquement moderne** — Next.js 16, React 19, Tailwind v4, Zod v4, Prisma v7

---

## Plan d'action prioritisé

### Immédiat (< 5 minutes)

```bash
# 1. Activer le middleware de sécurité
echo 'export { proxy as middleware, config } from "@/proxy";' > middleware.ts

# 2. Supprimer la dépendance inutilisée
pnpm remove zustand
```

### Court terme (< 30 minutes)

```bash
# 3. Rendre les warnings ESLint bloquants en CI
# → modifier "lint": "eslint --max-warnings 0" dans package.json

# 4. Ajouter Husky + lint-staged
pnpm add -D husky lint-staged
pnpm exec husky init

# 5. Implémenter la propagation du nonce CSP dans app/layout.tsx
```

---

## Scores par catégorie

| Catégorie | Score | Commentaire |
|---|---|---|
| Modernité de la stack | 10/10 | Bleeding-edge, toutes dépendances à jour |
| Qualité TypeScript | 9,5/10 | Exemplaire — zéro `any`, generics corrects, config stricte |
| Architecture React | 9/10 | Bonne séparation Server/Client, pas d'état inutile |
| Patterns Next.js | 8,5/10 | App Router maîtrisé ; bug du fichier middleware |
| Cohérence du code | 9,5/10 | Nommage, espacement, exports — cohérents partout |
| Usage de Tailwind | 9/10 | Config v4 CSS-based, tokens OKLCH, tri de classes |
| Sécurité | 6/10 | Bonne intention ; middleware inactif — headers non envoyés |
| Outillage & DX | 7/10 | Écart ESLint/Prettier ; pas de pre-commit |
| Couverture de tests | 8/10 | Tests unitaires complets dans `__tests__/` ; pas d'E2E |
| Code mort | 8,5/10 | Uniquement la dépendance zustand et le disconnect proxy.ts |

### **Score global : 8,5 / 10**

Travail de haute qualité. Le bug critique (middleware inactif) se corrige en une ligne. Les écarts outillage (Husky, warnings CI) se ferment en 15 minutes. Une fois ces points traités, la codebase atteint 9,5/10.
