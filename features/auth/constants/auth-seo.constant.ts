import type { WebPage, WithContext } from "schema-dts";

import { env } from "@/lib/env";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL;

// Sign In
const SIGN_IN_DESCRIPTION = `Connectez-vous à votre compte ${APP_NAME}. Accédez à votre tableau de bord et gérez vos projets.`;
const SIGN_IN_KEYWORDS = [
  APP_NAME.toLowerCase(),
  "connexion",
  "login",
  "sign in",
];

function getSignInSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/connexion/#webpage`,
    name: `Connexion | ${APP_NAME}`,
    description: SIGN_IN_DESCRIPTION,
    url: `${BASE_URL}/connexion`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Sign Up
const SIGN_UP_DESCRIPTION = `Créez votre compte ${APP_NAME} gratuitement. Accédez à toutes les fonctionnalités en quelques secondes.`;
const SIGN_UP_KEYWORDS = [
  APP_NAME.toLowerCase(),
  "inscription",
  "sign up",
  "créer un compte",
];

function getSignUpSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/inscription/#webpage`,
    name: `Inscription | ${APP_NAME}`,
    description: SIGN_UP_DESCRIPTION,
    url: `${BASE_URL}/inscription`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Forgot Password
const FORGOT_PASSWORD_DESCRIPTION = `Réinitialisez votre mot de passe ${APP_NAME}. Recevez un lien de réinitialisation par email.`;
const FORGOT_PASSWORD_KEYWORDS = [
  APP_NAME.toLowerCase(),
  "mot de passe oublié",
];

function getForgotPasswordSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/mot-de-passe-oublie/#webpage`,
    name: `Mot de passe oublié | ${APP_NAME}`,
    description: FORGOT_PASSWORD_DESCRIPTION,
    url: `${BASE_URL}/mot-de-passe-oublie`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

// Reset Password
const RESET_PASSWORD_DESCRIPTION = `Créez un nouveau mot de passe pour votre compte ${APP_NAME}.`;
const RESET_PASSWORD_KEYWORDS = [
  APP_NAME.toLowerCase(),
  "nouveau mot de passe",
];

function getResetPasswordSchema(): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/nouveau-mot-de-passe/#webpage`,
    name: `Nouveau mot de passe | ${APP_NAME}`,
    description: RESET_PASSWORD_DESCRIPTION,
    url: `${BASE_URL}/nouveau-mot-de-passe`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
    },
  };
}

export {
  SIGN_IN_DESCRIPTION,
  SIGN_IN_KEYWORDS,
  getSignInSchema,
  SIGN_UP_DESCRIPTION,
  SIGN_UP_KEYWORDS,
  getSignUpSchema,
  FORGOT_PASSWORD_DESCRIPTION,
  FORGOT_PASSWORD_KEYWORDS,
  getForgotPasswordSchema,
  RESET_PASSWORD_DESCRIPTION,
  RESET_PASSWORD_KEYWORDS,
  getResetPasswordSchema,
};
