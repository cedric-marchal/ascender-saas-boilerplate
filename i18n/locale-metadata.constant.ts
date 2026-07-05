import type { Locale } from "next-intl";

type LocaleMetadata = {
  bcp47: string;
  ogLocale: string;
  hreflang: string;
};

/**
 * Locale-specific metadata used for SEO (BCP47 language tags, Open Graph
 * locale, hreflang). `satisfies Record<Locale, LocaleMetadata>` guarantees
 * the typecheck fails when a new locale is added to `routing.locales`
 * without its metadata being defined here.
 *
 * NEVER branch on `locale === "fr"` anywhere else in the codebase — always
 * look up the value from this map.
 */
const LOCALE_METADATA = {
  en: {
    bcp47: "en-US",
    ogLocale: "en_US",
    hreflang: "en",
  },
  fr: {
    bcp47: "fr-FR",
    ogLocale: "fr_FR",
    hreflang: "fr",
  },
} satisfies Record<Locale, LocaleMetadata>;

export { LOCALE_METADATA };
export type { LocaleMetadata };
