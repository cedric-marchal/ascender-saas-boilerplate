# Configuration Stripe - Guide de mise en place

Ce guide vous explique comment configurer l'intégration Stripe pour gérer les abonnements dans votre application.

## 1. Prérequis

- Un compte Stripe (créez-en un sur [stripe.com](https://stripe.com))
- Accès au dashboard Stripe
- Variables d'environnement configurées dans `.env`

## 2. Variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env` :

```env
# Clés Stripe (récupérables sur https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... # Clé secrète (mode test ou production)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret webhook (voir section 4)

# Price IDs des produits (récupérables sur https://dashboard.stripe.com/products)
STRIPE_PRICE_ID_PRO=price_... # ID du prix de l'abonnement Pro
```

## 3. Création des produits et prix dans Stripe

### Étape 1 : Créer un produit

1. Connectez-vous au [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Produits** > **Ajouter un produit**
3. Remplissez les informations :
   - **Nom** : Pro
   - **Description** : Abonnement Pro pour les indépendants et petites équipes
   - **Prix** : 19 EUR
   - **Type de facturation** : Récurrente
   - **Période de facturation** : Mensuelle
4. Cliquez sur **Enregistrer le produit**
5. Copiez le **Price ID** (commence par `price_`) et ajoutez-le dans `.env` comme `STRIPE_PRICE_ID_PRO`

### Étape 2 : Répéter pour d'autres plans (optionnel)

Si vous souhaitez ajouter d'autres plans (ex: annuel), répétez l'étape 1 et ajoutez les nouveaux Price IDs dans `.env` et `lib/env.ts`.

## 4. Configuration du Webhook

Les webhooks permettent à Stripe de notifier votre application des événements (paiements, annulations, etc.).

**Architecture simplifiée** : Les webhooks sont actuellement configurés pour vérifier la signature et logger les événements. Stripe reste la seule source de vérité pour les abonnements (pas de copie en base de données).

### Étape 1 : Créer un endpoint webhook

1. Allez dans **Développeurs** > **Webhooks** > **Ajouter un endpoint**
2. URL de l'endpoint :
   - **Développement local** : Utilisez [Stripe CLI](https://stripe.com/docs/stripe-cli) pour tester localement
   - **Production** : `https://votre-domaine.com/api/stripe/webhooks`
3. Sélectionnez les événements à écouter (pour logging et futures fonctionnalités) :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Cliquez sur **Ajouter un endpoint**
5. Copiez le **Signing secret** (commence par `whsec_`) et ajoutez-le dans `.env` comme `STRIPE_WEBHOOK_SECRET`

### Étape 2 : Tester localement avec Stripe CLI

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter à Stripe
stripe login

# Écouter les webhooks localement
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Le CLI affichera le webhook secret temporaire - utilisez-le dans .env
```

## 5. Architecture de données

**Source de vérité unique : Stripe**

L'application utilise Stripe comme unique source de vérité pour les abonnements. Cela signifie :

- ✅ Les abonnements sont stockés uniquement dans Stripe
- ✅ La page facturation interroge l'API Stripe directement
- ✅ Pas de synchronisation de données = pas de risque de désynchronisation
- ✅ Moins de complexité = moins de bugs

**Seule donnée stockée localement** : Le mapping `userId` ↔ `stripeCustomerId` dans le modèle `StripeCustomer`.

Si vous faites des modifications au schéma Prisma :

```bash
npx prisma migrate dev --name votre_nom_de_migration
npx prisma generate
```

## 6. Configuration du Billing Portal

Le portail de facturation permet aux clients de gérer leurs abonnements (changer de plan, annuler, mettre à jour le paiement).

1. Allez dans **Paramètres** > **Portail de facturation**
2. Activez le portail
3. Configurez les options :
   - **Annulation d'abonnement** : Activé
   - **Changement de plan** : Activé
   - **Mise à jour des informations de paiement** : Activé
   - **Historique de facturation** : Activé
4. Enregistrez les modifications

## 7. Flux d'abonnement

### Création du compte Stripe (Lazy Creation)

Le compte Stripe est créé **uniquement au moment du checkout**, pas lors de l'inscription. Cela garantit que :

- ✅ Seuls les utilisateurs qui veulent vraiment payer ont un compte Stripe
- ✅ Votre dashboard Stripe ne contient que de vrais clients/prospects
- ✅ Pas de partage de données avec Stripe sans intention de paiement (RGPD)
- ✅ Moins d'appels API Stripe inutiles

**Note** : Les utilisateurs ADMIN ne peuvent jamais créer de compte Stripe ni s'abonner.

### Pour les utilisateurs

1. **Page Tarifs** (`/tarifs`) :
   - L'utilisateur clique sur "Choisir l'offre Pro"
   - Vérifications automatiques :
     - Utilisateur connecté ✓
     - Email vérifié ✓
     - Rôle CUSTOMER ✓
   - Redirection vers Stripe Checkout

2. **Stripe Checkout** :
   - Si le compte Stripe n'existe pas, il est créé automatiquement
   - L'utilisateur entre ses informations de paiement
   - Stripe traite le paiement
   - Redirection vers `/dashboard/facturation?success=true`

3. **Webhook Stripe** (optionnel) :
   - Stripe envoie les événements (`checkout.session.completed`, etc.)
   - L'application vérifie la signature et log les événements
   - **Aucune donnée n'est écrite en base** (Stripe est la source de vérité)

4. **Page Facturation** (`/dashboard/facturation`) :
   - Interroge directement l'API Stripe pour récupérer les abonnements
   - Affiche l'abonnement actif avec les détails à jour
   - Permet d'accéder au portail de facturation pour :
     - Changer de plan
     - Annuler l'abonnement
     - Mettre à jour le mode de paiement
     - Télécharger les factures

### Pour les admins

Les administrateurs (rôle `ADMIN`) **ne peuvent pas** souscrire à un abonnement. Cette restriction garantit que seuls les clients peuvent payer.

## 8. Vérifications de sécurité

### Vérification de l'email

L'email doit être vérifié avant de pouvoir souscrire à un abonnement. Cette vérification est gérée par :
- `requireCustomerVerifiedEmail()` dans `/lib/session.ts`
- Redirection automatique vers `/dashboard/parametres` si email non vérifié

### Vérification du rôle

Seuls les utilisateurs avec le rôle `CUSTOMER` peuvent souscrire. Cette vérification est effectuée :
- Côté serveur dans `/api/stripe/checkout/route.ts`
- Côté client dans le composant `PricingCheckoutButton`

## 9. Mode Test vs Mode Production

### Mode Test (développement)

- Utilisez les clés API de test (commencent par `sk_test_`)
- Utilisez les numéros de carte de test : `4242 4242 4242 4242`
- Les paiements ne sont pas réels

### Mode Production

- Utilisez les clés API de production (commencent par `sk_live_`)
- Activez le mode production dans Stripe
- Configurez les webhooks de production avec votre URL réelle
- **Important** : Vérifiez que tous les webhooks fonctionnent en production

## 10. Dépannage

### Le webhook ne fonctionne pas

- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Vérifiez les logs Stripe pour voir si les webhooks sont envoyés
- En local, assurez-vous que `stripe listen` est en cours d'exécution
- Vérifiez les logs serveur pour voir si les événements sont bien reçus et loggés

### L'utilisateur ne peut pas s'abonner

- Vérifiez que l'email est vérifié
- Vérifiez que le rôle est `CUSTOMER` (pas `ADMIN`)
- Vérifiez que `STRIPE_PRICE_ID_PRO` est correct dans `.env`
- Vérifiez que le compte Stripe est bien configuré (mode test/production)

### L'abonnement n'apparaît pas sur la page facturation

- Vérifiez que le paiement a bien été validé dans le Dashboard Stripe
- Vérifiez que le `stripeCustomerId` est bien enregistré dans la table `StripeCustomer`
- Vérifiez les logs de l'API Stripe pour voir si la requête échoue
- Testez manuellement avec `stripe.subscriptions.list()` dans un script pour vérifier la connexion

### Erreur lors du checkout

- Vérifiez que l'utilisateur a bien le rôle `CUSTOMER` (pas `ADMIN`)
- Vérifiez que l'email est vérifié
- Vérifiez que les clés API Stripe sont correctement configurées dans `.env`
- Vérifiez les logs serveur pour voir les erreurs lors de la création du client Stripe ou de la session

## 11. Ressources utiles

- [Documentation Stripe - Abonnements](https://stripe.com/docs/billing/subscriptions/overview)
- [Documentation Stripe - Webhooks](https://stripe.com/docs/webhooks)
- [Dashboard Stripe](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Cartes de test Stripe](https://stripe.com/docs/testing)

## 12. Support

Pour toute question ou problème, consultez :
- La documentation Stripe
- Les logs de l'application dans la console
- Les événements webhook dans le Dashboard Stripe
