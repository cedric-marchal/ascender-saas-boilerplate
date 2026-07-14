import type { Locale } from "next-intl";

/*
 * `error-page.tsx` and `global-error-page.tsx` are client components that
 * may render outside `NextIntlClientProvider` (the root error boundary has
 * no guaranteed locale context), so they cannot use `useTranslations`.
 * Importing the full `messages/*.json` catalogs client-side would also bloat
 * every chunk with strings the error boundary never needs. This module holds
 * only the handful of strings these two boundaries render, for both locales.
 */
type ErrorBoundaryMessages = {
  errorTitle: string;
  errorHeading: string;
  errorDescription: string;
  errorCode: string;
  retry: string;
  backHome: string;
  globalErrorTitle: string;
  globalErrorHeading: string;
  globalErrorDescription: string;
};

const ERROR_BOUNDARY_MESSAGES = {
  en: {
    errorTitle: "Error",
    errorHeading: "An error occurred",
    errorDescription: "Sorry, an unexpected error occurred. Please try again.",
    errorCode: "Code:",
    retry: "Retry",
    backHome: "Back to home",
    globalErrorTitle: "Critical error",
    globalErrorHeading: "A critical error occurred",
    globalErrorDescription:
      "Sorry, a critical error occurred. Please try again or refresh the page.",
  },
  fr: {
    errorTitle: "Erreur",
    errorHeading: "Une erreur est survenue",
    errorDescription:
      "Désolé, une erreur inattendue s'est produite. Veuillez réessayer.",
    errorCode: "Code :",
    retry: "Réessayer",
    backHome: "Retour à l'accueil",
    globalErrorTitle: "Erreur critique",
    globalErrorHeading: "Une erreur critique est survenue",
    globalErrorDescription:
      "Désolé, une erreur critique s'est produite. Veuillez réessayer ou rafraîchir la page.",
  },
} satisfies Record<Locale, ErrorBoundaryMessages>;

export { ERROR_BOUNDARY_MESSAGES };
