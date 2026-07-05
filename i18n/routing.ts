import { defineRouting } from "next-intl/routing";

const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/pricing": {
      en: "/pricing",
      fr: "/tarifs",
    },
    "/contact": "/contact",
    "/sitemap-page": {
      en: "/sitemap-page",
      fr: "/plan-du-site",
    },
    "/sign-in": {
      en: "/sign-in",
      fr: "/connexion",
    },
    "/sign-up": {
      en: "/sign-up",
      fr: "/inscription",
    },
    "/forgot-password": {
      en: "/forgot-password",
      fr: "/mot-de-passe-oublie",
    },
    "/reset-password": {
      en: "/reset-password",
      fr: "/nouveau-mot-de-passe",
    },
    "/legal-notice": {
      en: "/legal-notice",
      fr: "/mentions-legales",
    },
    "/terms-of-sale": {
      en: "/terms-of-sale",
      fr: "/conditions-de-vente",
    },
    "/terms-of-service": {
      en: "/terms-of-service",
      fr: "/conditions-d-utilisation",
    },
    "/privacy-policy": {
      en: "/privacy-policy",
      fr: "/politique-de-confidentialite",
    },
    "/cookie-policy": {
      en: "/cookie-policy",
      fr: "/politique-des-cookies",
    },
    "/dashboard": "/dashboard",
    "/dashboard/billing": {
      en: "/dashboard/billing",
      fr: "/dashboard/facturation",
    },
    "/dashboard/organization": {
      en: "/dashboard/organization",
      fr: "/dashboard/organisation",
    },
    "/dashboard/organization/audit": {
      en: "/dashboard/organization/audit",
      fr: "/dashboard/organisation/audit",
    },
    "/dashboard/settings": {
      en: "/dashboard/settings",
      fr: "/dashboard/parametres",
    },
    "/dashboard/projects": {
      en: "/dashboard/projects",
      fr: "/dashboard/projets",
    },
    "/admin": "/admin",
    "/admin/organizations": {
      en: "/admin/organizations",
      fr: "/admin/organisations",
    },
    "/admin/settings": {
      en: "/admin/settings",
      fr: "/admin/parametres",
    },
    "/admin/users": {
      en: "/admin/users",
      fr: "/admin/utilisateurs",
    },
    "/admin/users/[slug]": {
      en: "/admin/users/[slug]",
      fr: "/admin/utilisateurs/[slug]",
    },
  },
});

export { routing };
