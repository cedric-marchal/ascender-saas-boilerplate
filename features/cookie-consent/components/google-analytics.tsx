"use client";

import { useEffect } from "react";

import Script from "next/script";

import { useCookieConsent } from "@/features/cookie-consent/hooks/use-cookie-consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Synchronise le consentement Zustand avec l'API Consent Mode v2 de Google.
 * Définie en dehors du composant : ne dépend d'aucun état React,
 * lit toujours le state Zustand courant via getState().
 */
function syncConsentWithGA() {
  if (typeof window.gtag !== "function") {
    return;
  }

  const { preferences, hasConsented } = useCookieConsent.getState();

  if (!hasConsented) {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    ad_personalization: preferences.marketing ? "granted" : "denied",
  });
}

type GoogleAnalyticsProps = {
  measurementId: string;
};

function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const analyticsConsent = useCookieConsent(
    (state) => state.preferences.analytics,
  );
  const marketingConsent = useCookieConsent(
    (state) => state.preferences.marketing,
  );
  const hasConsented = useCookieConsent((state) => state.hasConsented);

  // Mise à jour en temps réel quand l'utilisateur change ses préférences
  useEffect(() => {
    syncConsentWithGA();
  }, [analyticsConsent, marketingConsent, hasConsented]);

  return (
    <>
      {/*
       * Script d'initialisation inline — s'exécute avant le chargement de gtag.js.
       * Le dataLayer agit comme une file : gtag.js traitera ces commandes à son chargement.
       * Consent Mode v2 : tout est refusé par défaut (RGPD).
       */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `,
        }}
      />
      {/*
       * Script externe gtag.js — chargé après hydratation.
       * onLoad : synchronise immédiatement le consentement persisté (visites suivantes).
       */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={syncConsentWithGA}
      />
    </>
  );
}

export { GoogleAnalytics };
