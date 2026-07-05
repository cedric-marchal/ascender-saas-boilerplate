---
name: plan
description: Billing completeness - dunning on payment failure, seat reconciliation on downgrade, multi-plan support, pinned Stripe API version
objective: "Failed payments notify the customer, downgrades reconcile seats explicitly, multiple plans are configurable, and the Stripe API version is pinned."
success_condition: "pnpm test && pnpm typecheck exit 0, including new tests for payment_failed dunning, downgrade seat reconciliation, and multi-plan config resolution"
iteration: 0
created_at: "2026-07-05T13:41:42Z"
---

# Instruction: Billing completeness (audit findings M3, M4 + multi-plan)

## Feature

- **Summary**: Close the billing product gaps: `invoice.payment_failed` triggers a dunning email and surfaces `PAST_DUE` in the UI; downgrades flag over-cap orgs; `PLAN_CONFIG` supports N plans; Stripe API version pinned per the 2026 twice-yearly release cadence.
- **Stack**: Stripe SDK 20.4 (API `2026-06-24.dahlia`), Prisma 7.8, React Email 6 + Resend, Upstash Redis
- **Branch name**: `feat/billing-completeness`
- **Parent Plan**: `./2026_07_05-audit-boilerplate-yc-master.md`
- **Sequence**: 4 of 6
- Confidence: 9/10
- Time to implement: 1–2 days

## Architecture projection

### Files to modify

- `lib/stripe.ts` - pin `apiVersion` explicitly
- `features/billing/services/stripe/handle-webhook.service.ts` - `invoice.payment_failed` → dunning email + cache bust; `customer.subscription.updated` → seat reconciliation hook
- `features/billing/constants/plan.constant.ts` - `PLAN_CONFIG` as a map of N plans (keep `pro`, add structure for more; resolve by price ID)
- `features/organizations/services/check-seat-capacity.service.ts` - expose over-cap detection reusable by reconciliation
- `features/billing/components/**` (subscription card) - `PAST_DUE` banner + portal CTA
- `lib/env.ts` + `.env.example` - price IDs per plan
- `__tests__/features/billing/services/stripe/handle-webhook.test.ts` - extend for new events/behaviors

### Files to create

- `features/billing/emails/payment-failed.email.tsx` - dunning email (React Email, French + i18n-ready keys)
- `features/billing/services/reconcile-seats.service.ts` - on downgrade: detect over-cap, mark org, notify owner (no auto-removal — product decision)
- `__tests__/features/billing/services/reconcile-seats.test.ts` - over-cap detection + notification, no member deletion

### Files to delete

- none

## Applicable rules

| Tool   | Name       | Path                          | Why it applies                                     |
| ------ | ---------- | ----------------------------- | -------------------------------------------------- |
| claude | security   | `.claude/rules/security.md`   | New services stay org-scoped                       |
| claude | api        | `.claude/rules/api.md`        | Webhook route behavior extended                    |
| claude | cache      | `.claude/rules/cache.md`      | Billing cache keys busted on new events            |
| claude | action     | `.claude/rules/action.md`     | Any new billing actions follow safe-action pattern |
| claude | code-style | `.claude/rules/code-style.md` | All edits                                          |

## User Journey

```mermaid
flowchart TD
  A[Card expires] --> B[Stripe: invoice.payment_failed]
  B --> C[Webhook: dunning email to org owner]
  C --> D[Dashboard shows PAST_DUE banner + portal CTA]
  D --> E{Payment fixed?}
  E -- yes --> F[invoice.payment_succeeded -> banner clears]
  E -- no --> G[subscription.updated -> UNPAID/CANCELED]
  G --> H[reconcile-seats: org over cap flagged, owner notified]
  H --> I[Org keeps members but cannot add until under cap]
```

## Risk register

| Risk                                                            | Impact                            | Mitigation                                                                   |
| --------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Dunning email sent on every retry of same invoice               | Spam                              | Redis dedupe key per invoice id (existing idempotency pattern)               |
| Auto-removing members on downgrade                              | Destructive surprise              | Explicit decision: flag + notify only, never delete (documented in service)  |
| Multi-plan refactor breaks seat-cap resolution in `lib/auth.ts` | Members blocked/unblocked wrongly | Keep price-ID → plan lookup as single source; extend existing seat-cap tests |
| Pinned API version drifts from SDK types                        | Type errors                       | Pin to SDK-shipped version; calendar note for twice-yearly Stripe review     |

## Implementation phases

### Phase 1: Pin Stripe API version + multi-plan config

> Config groundwork, no behavior change.

#### Tasks

1. Pin `apiVersion` in `lib/stripe.ts`
2. Restructure `PLAN_CONFIG` to N plans keyed by plan id, resolved by price ID; update `lib/auth.ts` membershipLimit lookup
3. Env vars per plan price ID; update seed if needed
4. Extend plan-resolution tests

#### Acceptance criteria

- [x] Existing seat-cap + webhook tests still green
- [x] Adding a plan = one config entry + one env var, no code change

### Phase 2: Dunning on payment_failed

> Failed payment becomes visible and actionable.

#### Tasks

1. `payment-failed.email.tsx` template
2. Webhook: on `invoice.payment_failed`, dedupe per invoice, email org owner, bust caches
3. `PAST_DUE` banner + customer-portal CTA in billing UI
4. Tests: email sent once per invoice, 5xx on handler failure preserved

#### Acceptance criteria

- [ ] Simulated `payment_failed` (stripe CLI) → one email + banner
- [ ] Retry of same event sends nothing

### Phase 3: Seat reconciliation on downgrade

> Over-cap orgs become a conscious state, not an accident.

#### Tasks

1. `reconcile-seats.service.ts`: compare member count vs new plan cap on `subscription.updated`/`deleted`
2. Notify owner when over cap; surface state on organization page
3. Tests: over-cap flagged, no member removed, add-member still blocked

#### Acceptance criteria

- [ ] Downgrade of a 5-member org to free flags it and notifies the owner
- [ ] `pnpm test && pnpm typecheck` green

## Amendments

## Log

### #1 - 2026-07-05T23:55:00Z

Phase 1 executed. Most of the groundwork was already in place from a prior pass:

- `lib/stripe.ts`: `apiVersion` was already pinned to `"2026-02-25.clover"`, matching the literal exported by the installed `stripe@20.4.1` SDK (`node_modules/stripe/types/apiVersion.d.ts` → `ApiVersion`/`LatestApiVersion`). No change needed.
- `features/billing/constants/plan.constant.ts`: `PLAN_CONFIG` was already a map keyed by plan id (only `pro` populated) with `priceId`/`label`/`seatsIncluded`/`features`, and `getPlanByPriceId`/`getPlanLabel`/`getPriceIds`/`getSeatsIncluded`/`ALLOWED_PRICE_IDS` all iterate `Object.values(PLAN_CONFIG)` — none reference `pro` literally. Adding a plan is genuinely one config entry + one env var.
- `lib/auth.ts` (`membershipLimit`) and `features/organizations/services/check-seat-capacity.service.ts` already resolve seat caps through `getPlanByPriceId(...).seatsIncluded ?? FREE_PLAN_SEAT_CAP` — no literal plan-key branching.
- `label` stays a plain string (not a translation key): it's a proper noun ("Pro") identical in every locale, same decision already documented in the file's JSDoc. This is consistent with `i18n.md`'s rule, which mandates translation keys for `Record<Enum, string>` UI labels, not for locale-invariant proper nouns.

What I added this pass:

- `__tests__/features/billing/constants/plan.constant.test.ts`: new coverage for `PLAN_CONFIG` shape (every entry has priceId/label/seatsIncluded/features), `ALLOWED_PRICE_IDS` derivation, `getPlanByPriceId`/`getPlanLabel` known vs unknown price ID resolution, `getSeatsIncluded`, `getPriceIds`.
- `.env.example`: added a comment documenting that additional `STRIPE_PRICE_ID_*` vars slot in per plan, one var + one `PLAN_CONFIG` entry, no other code change.

Validation: `pnpm test` (60 files / 622 tests, all green, +10 new tests), `pnpm typecheck` clean, `pnpm lint` clean.

## Validation flow demonstration

1. `pnpm stripe:listen`, subscribe a test org to Pro, add 4 members
2. `stripe trigger invoice.payment_failed` → dunning email in Resend logs, banner in dashboard
3. Cancel subscription → owner notified org is over cap; adding a member is refused; existing members intact
4. `pnpm test` — all billing suites green
