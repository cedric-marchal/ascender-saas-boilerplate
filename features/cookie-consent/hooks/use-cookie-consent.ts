import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const COOKIE_CATEGORIES = {
  essential: {
    label: "Nécessaires",
    description:
      "Ces cookies sont indispensables au bon fonctionnement du site. Ils ne peuvent pas être désactivés.",
    required: true,
  },
  functional: {
    label: "Fonctionnalités",
    description:
      "Ces cookies permettent de mémoriser vos préférences comme votre thème ou votre langue.",
    required: false,
  },
  analytics: {
    label: "Analytiques",
    description:
      "Ces cookies nous aident à comprendre comment vous utilisez notre site pour l'améliorer.",
    required: false,
  },
  marketing: {
    label: "Marketing",
    description:
      "Ces cookies sont utilisés pour vous proposer du contenu personnalisé et des publicités adaptées.",
    required: false,
  },
} as const;

type CookieCategoryId = keyof typeof COOKIE_CATEGORIES;

type CookiePreferences = Record<CookieCategoryId, boolean>;

type CookieConsentStore = {
  hasConsented: boolean;
  consentTimestamp: number | null;
  preferences: CookiePreferences;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateCategory: (categoryId: CookieCategoryId, enabled: boolean) => void;
  savePreferences: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const COOKIE_STORAGE = createJSONStorage(() => ({
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
}));

const useCookieConsent = create<CookieConsentStore>()(
  persist(
    (set) => ({
      hasConsented: false,
      consentTimestamp: null,
      preferences: DEFAULT_PREFERENCES,
      isPreferencesOpen: false,

      acceptAll: () =>
        set({
          hasConsented: true,
          consentTimestamp: Date.now(),
          preferences: {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
          },
        }),

      rejectAll: () =>
        set({
          hasConsented: true,
          consentTimestamp: Date.now(),
          preferences: DEFAULT_PREFERENCES,
        }),

      updateCategory: (categoryId: CookieCategoryId, enabled: boolean) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [categoryId]: COOKIE_CATEGORIES[categoryId].required
              ? true
              : enabled,
          },
        })),

      savePreferences: () =>
        set((state) => ({
          hasConsented: true,
          consentTimestamp: Date.now(),
          isPreferencesOpen: false,
          preferences: {
            ...state.preferences,
            essential: true,
          },
        })),

      openPreferences: () => set({ isPreferencesOpen: true }),
      closePreferences: () => set({ isPreferencesOpen: false }),
    }),
    {
      name: "ascender-cookie-consent",
      version: 1,
      storage: COOKIE_STORAGE,
      partialize: (state) => ({
        hasConsented: state.hasConsented,
        consentTimestamp: state.consentTimestamp,
        preferences: state.preferences,
      }),
    },
  ),
);

export { useCookieConsent, COOKIE_CATEGORIES };

export type { CookieCategoryId, CookiePreferences };
