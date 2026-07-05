# Decision: i18n architecture — next-intl with English canonical routes

| Field   | Value      |
| ------- | ---------- |
| ID      | DEC-001    |
| Date    | 2026-07-05 |
| Feature | i18n       |
| Status  | Accepted   |

## Context

The boilerplate was single-language French (hardcoded strings in ~95 files, French URL slugs), blocking its target audience (YC-grade, anglophone-first SaaS teams). The App Router has no built-in i18n, so a library and a routing strategy had to be chosen — including where the canonical route names live and how per-project language needs (mono-language FR up to multi-market) are served.

## Decision

Adopt next-intl with a `[locale]` segment (`en` default, `fr` secondary, `localePrefix: "always"`). Route folders are renamed to English and become the canonical internal pathnames; localized URLs (including all legacy French slugs) are served exclusively through the `pathnames` map in `i18n/routing.ts`, making that file the single source of truth for links. User locale is derived from the `NEXT_LOCALE` cookie (no DB field). Per-project language needs are a config concern: shrink `routing.locales` and set `localePrefix` — the i18n infrastructure is never removed.

## Alternatives Considered

| Alternative                            | Pros                         | Cons                                             | Rejected because                                              |
| -------------------------------------- | ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Rewrite everything in English, no i18n | Fastest                      | Loses FR market; rework if multilingual later    | Boilerplate serves projects with different market needs       |
| react-i18next / Paraglide              | Mature ecosystems            | Weaker RSC/App Router integration than next-intl | next-intl is the 2026 App Router standard (~2KB, RSC-native)  |
| French folders as canonical routes     | No folder renames            | Clashes with code-in-English convention          | Folder names are internal identifiers once `pathnames` exists |
| `User.locale` DB field                 | Locale survives cross-device | Schema migration; cookie covers the real cases   | Cookie + per-call-site derivation is simpler and sufficient   |

## Consequences

- Positive: typed routes (pathnames union + typedRoutes), per-project locale config in one file, legacy French URLs preserved via 301s + `pathnames`, catalogs enforced in parity by CI.
- Negative: every new route must be declared in `pathnames`; surfaces rendering outside the intl provider (root boundaries, emails, error boundaries) must use the context-free helpers — codified in `.claude/rules/i18n.md`.
- 404s under PPR return HTTP 200 + `noindex` meta (framework behavior), not a hard 404 status.
