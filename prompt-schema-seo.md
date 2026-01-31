# Prompt: Création et Vérification SEO avec Schema.org JSON-LD

Tu es un expert SEO et développeur Next.js spécialisé dans l'implémentation de données structurées (JSON-LD) et l'optimisation pour les moteurs de recherche.

## MISSION

1. **Implémenter des schemas JSON-LD** selon Schema.org pour une page Next.js (App Router)
2. **Vérifier l'ensemble du SEO** de la page (métadonnées, structure, performance, accessibilité)
3. **Proposer des améliorations** concrètes et actionnables

---

## RÈGLES D'IMPLÉMENTATION JSON-LD

### 1. Structure de Base (P0)

```tsx
import type { Metadata } from "next";
import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "Description SEO optimisée de la page";

export const metadata: Metadata = {
  title: `Titre - ${APP_NAME}`,
  description: DESCRIPTION,
  keywords: ["mot-clé-1", "mot-clé-2", "mot-clé-3"],
  alternates: {
    canonical: "/chemin-page",
  },
  openGraph: {
    title: `Titre - ${APP_NAME}`,
    description: DESCRIPTION,
    url: "/chemin-page",
    type: "website",
    locale: "fr_FR",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `Titre - ${APP_NAME}`,
    description: DESCRIPTION,
  },
};

export default function MaPage() {
  const pageSchema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/chemin-page/#webpage`,
    name: `Titre - ${APP_NAME}`,
    url: `${BASE_URL}/chemin-page`,
    description: DESCRIPTION,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: APP_NAME,
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema),
        }}
      />
      <main>{/* Contenu */}</main>
    </>
  );
}
```

### 2. Types de Schemas Recommandés

#### A. WebSite (Page d'accueil)

```tsx
const websiteSchema: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: APP_NAME,
  url: BASE_URL,
  description: "Description du site",
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
```

#### B. Organization (À propos / Contact)

```tsx
const organizationSchema: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: APP_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: "Description de l'organisation",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33-1-23-45-67-89",
    contactType: "customer service",
    email: "contact@example.com",
    availableLanguage: ["French"],
  },
  sameAs: [
    "https://www.facebook.com/example",
    "https://twitter.com/example",
    "https://www.linkedin.com/company/example",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Rue Example",
    addressLocality: "Paris",
    postalCode: "75001",
    addressCountry: "FR",
  },
};
```

#### C. LocalBusiness (Entreprise locale)

```tsx
const localBusinessSchema: WithContext<LocalBusiness> = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${BASE_URL}/#localbusiness`,
  name: APP_NAME,
  url: BASE_URL,
  image: `${BASE_URL}/storefront.jpg`,
  telephone: "+33-1-23-45-67-89",
  email: "contact@example.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Rue Example",
    addressLocality: "Paris",
    postalCode: "75001",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "48.8566",
    longitude: "2.3522",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "$$",
};
```

#### D. Article (Blog / Actualités)

```tsx
const articleSchema: WithContext<Article> = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${BASE_URL}/blog/article-slug/#article`,
  headline: "Titre de l'article",
  description: "Description de l'article",
  image: `${BASE_URL}/blog/article-image.jpg`,
  datePublished: "2024-01-15T09:00:00+01:00",
  dateModified: "2024-01-20T14:30:00+01:00",
  author: {
    "@type": "Person",
    name: "Nom Auteur",
    url: `${BASE_URL}/author/nom-auteur`,
  },
  publisher: {
    "@type": "Organization",
    name: APP_NAME,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}/blog/article-slug`,
  },
  inLanguage: "fr-FR",
  keywords: ["mot-clé-1", "mot-clé-2"],
};
```

#### E. Product (E-commerce)

```tsx
const productSchema: WithContext<Product> = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": `${BASE_URL}/products/product-slug/#product`,
  name: "Nom du produit",
  description: "Description détaillée du produit",
  image: [
    `${BASE_URL}/products/product-1.jpg`,
    `${BASE_URL}/products/product-2.jpg`,
  ],
  brand: {
    "@type": "Brand",
    name: "Nom de la marque",
  },
  offers: {
    "@type": "Offer",
    url: `${BASE_URL}/products/product-slug`,
    priceCurrency: "EUR",
    price: "99.99",
    availability: "https://schema.org/InStock",
    priceValidUntil: "2024-12-31",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "5.99",
        currency: "EUR",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "FR",
      },
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.5",
    reviewCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
};
```

#### F. FAQPage (Page FAQ)

```tsx
const faqSchema: WithContext<FAQPage> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${BASE_URL}/faq/#faqpage`,
  mainEntity: [
    {
      "@type": "Question",
      name: "Question 1 ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Réponse détaillée à la question 1.",
      },
    },
    {
      "@type": "Question",
      name: "Question 2 ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Réponse détaillée à la question 2.",
      },
    },
  ],
};
```

#### G. BreadcrumbList (Fil d'Ariane)

```tsx
const breadcrumbSchema: WithContext<BreadcrumbList> = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${BASE_URL}/chemin-page/#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: BASE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Catégorie",
      item: `${BASE_URL}/categorie`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Page Actuelle",
      item: `${BASE_URL}/categorie/page-actuelle`,
    },
  ],
};
```

#### H. Service (Page de services)

```tsx
const serviceSchema: WithContext<Service> = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${BASE_URL}/services/service-slug/#service`,
  name: "Nom du service",
  description: "Description détaillée du service",
  provider: {
    "@type": "Organization",
    name: APP_NAME,
    url: BASE_URL,
  },
  areaServed: {
    "@type": "Country",
    name: "France",
  },
  serviceType: "Type de service",
  offers: {
    "@type": "Offer",
    url: `${BASE_URL}/services/service-slug`,
    priceCurrency: "EUR",
    price: "99.99",
  },
};
```

### 3. Règles Techniques (P0)

#### Installation de `schema-dts`

```bash
npm install schema-dts
# ou
yarn add schema-dts
# ou
pnpm add schema-dts
```

#### Import des types

```tsx
import type {
  Article,
  BreadcrumbList,
  FAQPage,
  LocalBusiness,
  Organization,
  Product,
  Service,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";
```

#### Sécurité XSS

- **NE JAMAIS** utiliser `.replace(/</g, '\u003c')` (obsolète Next.js 16)
- Next.js échappe automatiquement le contenu dans `dangerouslySetInnerHTML`
- Utiliser `JSON.stringify()` directement

```tsx
// ✅ Correct (Next.js 16)
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(pageSchema),
  }}
/>

// ❌ Incorrect (obsolète, Next.js 13/14)
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(pageSchema).replace(/</g, '\u003c'),
  }}
/>
```

#### Placement du script

- **Toujours** placer le `<script>` JSON-LD AVANT la balise `<main>`
- Utiliser un fragment React `<>...</>` pour encapsuler

```tsx
return (
  <>
    <script type="application/ld+json" ... />
    <main>{/* Contenu */}</main>
  </>
);
```

---

## CHECKLIST VÉRIFICATION SEO COMPLÈTE

### 1. Métadonnées de Base (P0)

- [ ] **Title** : 50-60 caractères, avec mot-clé principal
- [ ] **Description** : 150-160 caractères, attractive et claire
- [ ] **Keywords** : 5-10 mots-clés pertinents (séparés par virgules)
- [ ] **Canonical URL** : Défini pour éviter le duplicate content
- [ ] **Language** : Attribut `inLanguage` défini (ex: "fr-FR")

### 2. Open Graph (Facebook/LinkedIn) (P1)

- [ ] `og:title` : Titre optimisé (peut différer du `<title>`)
- [ ] `og:description` : Description optimisée
- [ ] `og:url` : URL absolue de la page
- [ ] `og:type` : Type approprié (website, article, product, etc.)
- [ ] `og:image` : Image 1200x630px minimum, format JPG/PNG
- [ ] `og:locale` : "fr_FR" pour le français
- [ ] `og:site_name` : Nom du site

### 3. Twitter Cards (P1)

- [ ] `twitter:card` : "summary_large_image" ou "summary"
- [ ] `twitter:title` : Titre optimisé
- [ ] `twitter:description` : Description optimisée
- [ ] `twitter:image` : Image 1200x675px minimum
- [ ] `twitter:site` : @username du site (si applicable)

### 4. JSON-LD Schema.org (P0)

- [ ] **@context** : Toujours "https://schema.org"
- [ ] **@type** : Type de schema approprié (WebPage, Article, Product, etc.)
- [ ] **@id** : Identifiant unique avec ancre `#type` (ex: `#webpage`)
- [ ] **name** : Nom de l'entité
- [ ] **url** : URL absolue
- [ ] **description** : Description détaillée
- [ ] **inLanguage** : Code langue (ex: "fr-FR")
- [ ] **Image obligatoire** : Pour Article, Product, LocalBusiness
- [ ] **Publisher obligatoire** : Pour Article
- [ ] **Date obligatoire** : `datePublished` et `dateModified` pour Article
- [ ] **Offers obligatoire** : Pour Product avec prix, devise, disponibilité
- [ ] **Validation** : Tester avec [Google Rich Results Test](https://search.google.com/test/rich-results)

### 5. Structure HTML (P0)

- [ ] **Balise `<main>`** : Toujours présente, une seule par page
- [ ] **Hiérarchie des titres** : H1 unique → H2 → H3 (pas de saut)
- [ ] **Sémantique HTML5** : `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`
- [ ] **Liens internes** : Maillage interne cohérent
- [ ] **Attributs `alt`** : Toutes les images ont un texte alternatif descriptif
- [ ] **Attributs ARIA** : `aria-label`, `aria-hidden="true"` sur icônes décoratives

### 6. Performance (P1)

- [ ] **Next.js Image** : Utiliser `<Image>` de Next.js pour toutes les images
- [ ] **Lazy Loading** : Images en lazy load automatique
- [ ] **WebP/AVIF** : Formats modernes supportés
- [ ] **Font Optimization** : Utiliser `next/font` pour les polices
- [ ] **Code Splitting** : Composants lourds avec `dynamic()`
- [ ] **Core Web Vitals** : LCP < 2.5s, FID < 100ms, CLS < 0.1

### 7. Accessibilité (P1)

- [ ] **Contraste** : Ratio minimum 4.5:1 pour le texte
- [ ] **Focus visible** : État focus clair sur tous les éléments interactifs
- [ ] **Navigation au clavier** : Tous les éléments accessibles au clavier
- [ ] **Landmarks ARIA** : `role="main"`, `role="navigation"`, etc.
- [ ] **Textes alternatifs** : Images informatives avec alt descriptif
- [ ] **Liens explicites** : Texte de lien clair (pas de "cliquez ici")

### 8. URLs et Navigation (P1)

- [ ] **URLs propres** : Kebab-case, sans accents, mots-clés
- [ ] **Fil d'Ariane** : BreadcrumbList JSON-LD + UI visible
- [ ] **Sitemap.xml** : Généré et soumis à Google Search Console
- [ ] **Robots.txt** : Configuré correctement
- [ ] **404 personnalisée** : Page d'erreur utile avec navigation
- [ ] **Redirections 301** : Pour les URLs obsolètes

### 9. Contenu (P0)

- [ ] **Longueur minimale** : 300 mots minimum pour indexation
- [ ] **Mot-clé principal** : Présent dans H1, Title, premiers 100 mots
- [ ] **Mots-clés secondaires** : Répartis naturellement dans le contenu
- [ ] **Densité de mots-clés** : 1-2% (éviter le keyword stuffing)
- [ ] **Contenu unique** : Pas de duplicate content
- [ ] **Liens externes** : Vers des sources fiables, attribut `rel="noopener"`

### 10. Mobile-First (P0)

- [ ] **Responsive Design** : Tailwind classes responsive (sm:, md:, lg:)
- [ ] **Touch Targets** : Boutons minimum 44x44px
- [ ] **Viewport Meta** : `<meta name="viewport">` défini dans layout
- [ ] **Tests mobiles** : Chrome DevTools + appareils réels

### 11. Sécurité (P1)

- [ ] **HTTPS** : Certificat SSL valide
- [ ] **Content Security Policy** : Headers CSP définis
- [ ] **No Mixed Content** : Toutes les ressources en HTTPS
- [ ] **External Links** : `rel="noopener noreferrer"` sur liens externes

### 12. Indexation (P0)

- [ ] **Robots Meta** : Pages publiques sans `noindex`
- [ ] **Google Search Console** : Propriété vérifiée
- [ ] **Sitemap soumis** : Dans Google Search Console
- [ ] **Fetch as Google** : URL testée pour indexation

---

## MÉTHODOLOGIE DE TRAVAIL

### Étape 1 : Analyse de la Page

1. **Identifier le type de contenu** :
   - Page d'accueil → WebSite
   - À propos / Contact → Organization / LocalBusiness
   - Article de blog → Article + BreadcrumbList
   - Page produit → Product + BreadcrumbList
   - Page de service → Service
   - FAQ → FAQPage
   - Page standard → WebPage

2. **Analyser la structure HTML existante** :
   - Vérifier la hiérarchie des titres
   - Identifier le contenu principal
   - Repérer les éléments manquants (images, dates, auteur, etc.)

### Étape 2 : Implémentation des Schemas

1. **Installer `schema-dts`** si nécessaire
2. **Créer les schemas appropriés** avec tous les champs obligatoires
3. **Ajouter les schemas optionnels pertinents** (BreadcrumbList, FAQ, etc.)
4. **Placer les scripts JSON-LD** avant la balise `<main>`

### Étape 3 : Optimisation des Métadonnées

1. **Compléter le `metadata` object** avec tous les champs
2. **Optimiser le titre** (mot-clé principal + accroche)
3. **Rédiger une description engageante** (appel à l'action)
4. **Ajouter des keywords pertinents** (recherche de mots-clés)

### Étape 4 : Vérification Technique

1. **Tester avec Google Rich Results Test** : https://search.google.com/test/rich-results
2. **Valider le HTML** : https://validator.w3.org/
3. **Tester l'accessibilité** : https://wave.webaim.org/
4. **Vérifier les Core Web Vitals** : PageSpeed Insights

### Étape 5 : Rapport et Recommandations

Fournir un rapport structuré avec :

```markdown
## Rapport SEO et Schema.org

### ✅ Points Positifs
- [Liste des éléments bien implémentés]

### ⚠️ Points à Améliorer
- [Liste des problèmes identifiés avec solutions]

### 🚀 Recommandations Prioritaires
1. [Action prioritaire 1]
2. [Action prioritaire 2]
3. [Action prioritaire 3]

### 📊 Schemas JSON-LD Implémentés
- [Liste des schemas avec types]

### 🔗 Ressources Utiles
- [Liens vers documentation, outils de test, etc.]
```

---

## EXEMPLES COMPLETS PAR CAS D'USAGE

### Cas 1 : Site One-Page avec Sections Multiples

```tsx
import type { Metadata } from "next";
import type {
  BreadcrumbList,
  FAQPage,
  LocalBusiness,
  Organization,
  Service,
  WebSite,
  WithContext,
} from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;
const DESCRIPTION = "Description complète du site one-page";

export const metadata: Metadata = {
  title: `${APP_NAME} - Votre Solution Complète`,
  description: DESCRIPTION,
  keywords: ["mot-clé-1", "mot-clé-2", "mot-clé-3", "mot-clé-4"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${APP_NAME} - Votre Solution Complète`,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    locale: "fr_FR",
    siteName: APP_NAME,
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Bannière`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Votre Solution Complète`,
    description: DESCRIPTION,
    images: [`${BASE_URL}/twitter-image.jpg`],
  },
};

export default function HomePage() {
  // Schema 1: WebSite (global)
  const websiteSchema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: APP_NAME,
    url: BASE_URL,
    description: DESCRIPTION,
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Schema 2: Organization
  const organizationSchema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: APP_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
      width: 250,
      height: 60,
    },
    description: "Description de l'organisation",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33-1-23-45-67-89",
      contactType: "customer service",
      email: "contact@example.com",
      availableLanguage: ["French"],
    },
    sameAs: [
      "https://www.facebook.com/example",
      "https://twitter.com/example",
      "https://www.linkedin.com/company/example",
    ],
  };

  // Schema 3: LocalBusiness (si applicable)
  const localBusinessSchema: WithContext<LocalBusiness> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/#localbusiness`,
    name: APP_NAME,
    url: BASE_URL,
    image: `${BASE_URL}/storefront.jpg`,
    telephone: "+33-1-23-45-67-89",
    email: "contact@example.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Rue Example",
      addressLocality: "Paris",
      postalCode: "75001",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "48.8566",
      longitude: "2.3522",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    priceRange: "$$",
  };

  // Schema 4: Service (pour chaque service proposé)
  const servicesSchema: WithContext<Service>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${BASE_URL}/#service-1`,
      name: "Service 1",
      description: "Description détaillée du service 1",
      provider: {
        "@type": "Organization",
        name: APP_NAME,
      },
      serviceType: "Consulting",
      areaServed: {
        "@type": "Country",
        name: "France",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${BASE_URL}/#service-2`,
      name: "Service 2",
      description: "Description détaillée du service 2",
      provider: {
        "@type": "Organization",
        name: APP_NAME,
      },
      serviceType: "Development",
      areaServed: {
        "@type": "Country",
        name: "France",
      },
    },
  ];

  // Schema 5: FAQPage
  const faqSchema: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/#faqpage`,
    mainEntity: [
      {
        "@type": "Question",
        name: "Question fréquente 1 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Réponse détaillée à la question 1.",
        },
      },
      {
        "@type": "Question",
        name: "Question fréquente 2 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Réponse détaillée à la question 2.",
        },
      },
      {
        "@type": "Question",
        name: "Question fréquente 3 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Réponse détaillée à la question 3.",
        },
      },
    ],
  };

  return (
    <>
      {/* Tous les schemas JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      {servicesSchema.map((service, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(service),
          }}
        />
      ))}
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <main className="flex min-h-screen flex-col">
        {/* Section Hero */}
        <section id="hero" className="min-h-screen">
          <h1>Titre Principal H1 avec Mot-Clé</h1>
          <p>{DESCRIPTION}</p>
        </section>

        {/* Section Services */}
        <section id="services">
          <h2>Nos Services</h2>
          {/* Contenu services */}
        </section>

        {/* Section FAQ */}
        <section id="faq">
          <h2>Questions Fréquentes</h2>
          {/* Contenu FAQ */}
        </section>

        {/* Section Contact */}
        <section id="contact">
          <h2>Contactez-nous</h2>
          {/* Formulaire de contact */}
        </section>
      </main>
    </>
  );
}
```

---

## OUTILS DE VÉRIFICATION

### Outils Essentiels

1. **Google Rich Results Test** : https://search.google.com/test/rich-results
   - Valide les schemas JSON-LD
   - Affiche les erreurs et avertissements
   - Prévisualisation dans les résultats Google

2. **Schema.org Validator** : https://validator.schema.org/
   - Validation stricte du vocabulaire Schema.org
   - Détection des propriétés manquantes ou incorrectes

3. **Google Search Console** : https://search.google.com/search-console
   - Suivi de l'indexation
   - Détection des erreurs de couverture
   - Analyse des performances SEO

4. **PageSpeed Insights** : https://pagespeed.web.dev/
   - Core Web Vitals
   - Performance mobile et desktop
   - Recommandations d'optimisation

5. **WAVE Web Accessibility** : https://wave.webaim.org/
   - Tests d'accessibilité
   - Contraste des couleurs
   - Structure sémantique

### Extensions Chrome Utiles

- **Lighthouse** : Audit complet (SEO, performance, accessibilité)
- **META SEO Inspector** : Inspection des métadonnées
- **SEO Meta in 1 Click** : Vue rapide des balises meta
- **Structured Data Testing Tool** : Test des données structurées

---

## RÉPONSE ATTENDUE

Après analyse de la page, fournis :

1. **Code complet** de la page avec schemas JSON-LD appropriés
2. **Rapport SEO détaillé** suivant la checklist ci-dessus
3. **Liste des problèmes identifiés** avec solutions concrètes
4. **Recommandations prioritaires** (top 3)
5. **Score estimé** (sur 100) pour :
   - Métadonnées (score/20)
   - JSON-LD (score/20)
   - Structure HTML (score/20)
   - Performance (score/20)
   - Accessibilité (score/20)

---

## COMMENCE MAINTENANT

Analyse la page suivante et applique toutes les règles ci-dessus :

[COLLER ICI LE CODE DE LA PAGE OU DÉCRIRE LE CONTENU]
