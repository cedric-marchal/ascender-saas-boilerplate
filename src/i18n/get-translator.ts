import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { createTranslator, type Locale } from "next-intl";

const MESSAGES_BY_LOCALE = { en, fr } satisfies Record<Locale, typeof en>;

/**
 * Returns a next-intl core translator bound to `messages/<locale>.json`.
 * Unlike `getTranslations`/`getLocale` from `next-intl/server`, this does not
 * depend on next-intl's request config (populated by the `[locale]` route
 * segment or `proxy.ts` middleware) — it works anywhere, including React
 * Email templates rendered outside the Next.js request context and API
 * routes/Better Auth hooks that `proxy.ts` excludes from locale negotiation.
 */
function getTranslator(locale: Locale) {
  return createTranslator({ locale, messages: MESSAGES_BY_LOCALE[locale] });
}

export { getTranslator };
