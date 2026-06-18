---
name: master_plan
description: B2C to B2B multi-tenant migration via Better Auth organization plugin, personal-org pattern
argument-hint: N/A
---

# Master Plan: B2B Organizations (multi-tenant)

## Overview

- **Goal**: Turn the B2C boilerplate into B2B multi-tenant using Better Auth `organization` plugin, keeping B2C alive as a personal org (org of 1).
- **Risk Score**: 11/10 (schema migration + 5+ modules + major refactor + breaking internal APIs)
- **Branch**: `feat/b2b-organizations`
- **In prod**: No -> no data backfill script.

## Core decisions (locked)

- Architecture: B2B pur multi-tenant, org always. B2C = personal org auto-created at signup.
- Personal org created ONLY when `role === CUSTOMER`. Staff (ADMIN) gets no org, no Stripe customer.
- Multi-org membership + org switching (switcher hidden while solo).
- Billing: 1 flat Stripe subscription per org. Custom Stripe layer kept (NOT `@better-auth/stripe`). Wired via `afterCreateOrganization` (create customer) + `membershipLimit` (seat cap).
- Org roles v1: owner / admin / member. Access-control infra posed for future custom roles (viewer, billing_manager). Teams out of scope.
- Billing managed by owner + admin.
- Platform roles unchanged: `UserRole { ADMIN, CUSTOMER }`.
- Feature gating: declarative plan config -> `canUse(org, feature)`.
- Audit log in v1: `AuditLog` + `logEvent()`.
- Out of v1: Teams, SSO/SAML, SCIM, domain auto-join, schema-per-tenant, API keys, custom org roles.

## Child Plans

| #   | Plan                         | File                                       | Status | Validated |
| --- | ---------------------------- | ------------------------------------------ | ------ | --------- |
| 1   | Org foundation               | `./2026_06_18-b2b-organizations-part-1.md` | done   | [ ]       |
| 2   | Onboarding & invitations     | `./2026_06_18-b2b-organizations-part-2.md` | done   | [ ]       |
| 3   | Members & roles              | `./2026_06_18-b2b-organizations-part-3.md` | done   | [ ]       |
| 4   | Billing org + feature gating | `./2026_06_18-b2b-organizations-part-4.md` | done   | [ ]       |
| 5   | Security re-scoping + audit  | `./2026_06_18-b2b-organizations-part-5.md` | done   | [ ]       |
| 6   | Admin platform orgs view     | `./2026_06_18-b2b-organizations-part-6.md` | done   | [ ]       |

<!-- Status values: pending, in-progress, done, blocked -->
<!-- RULE: Plan N+1 blocked until Plan N checkbox checked -->

## Validation Protocol

1. Complete Plan 1, run its validations
2. [ ] Checkpoint 1: User confirms foundation (migration + active org in session)
3. Unblock Plan 2 (onboarding), repeat
4. [ ] Checkpoint 2: signup CUSTOMER -> personal org, invitations work
5. Unblock Plan 3 (members), repeat
6. [ ] Checkpoint 3: members/roles/transfer/last-owner guard
7. Unblock Plan 4 (billing), repeat
8. [ ] Checkpoint 4: org-scoped checkout/webhook + gating + seat cap
9. Unblock Plan 5 (security + audit), repeat
10. [ ] Checkpoint 5: IDOR isolation tests GREEN (blocking) + audit log
11. Unblock Plan 6 (admin), repeat
12. [ ] Final: Integration test, full suite green

## Success condition (master)

`pnpm test` passes INCLUDING the cross-org isolation tests (Phase 5) AND `pnpm build` succeeds AND `pnpm prisma migrate deploy` applies cleanly.

## Risk register

| Risk                                          | Impact                         | Mitigation                                                         |
| --------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| IDOR during userId->organizationId re-scoping | Cross-org data leak            | Membership check everywhere + blocking isolation tests (Phase 5)   |
| cookieCache 60s vs setActive (UNVERIFIED)     | Stale active org up to 1 min   | Integration test; `disableCookieCache` on sensitive reads          |
| Org-delete lifecycle hook (UNVERIFIED)        | Stripe not cancelled on delete | Fallback `databaseHooks.organization.delete.before` + test         |
| afterEmailVerification syncs Stripe to user   | Inconsistent under org model   | Remove it; defer sync to `afterCreateOrganization`                 |
| Last owner leaves/deletes account             | Orphan org                     | `is-last-owner` guard + mandatory ownership transfer               |
| Org slug collision                            | Create org fails               | Slug uniqueness handled at create (suffix like existing user slug) |

## Estimations

- **Confidence**: 9/10
- **Duration**: ~1 to 1.5 week for a clean, tested v1.
