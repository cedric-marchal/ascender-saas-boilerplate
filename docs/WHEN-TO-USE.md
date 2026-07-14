# When to use this boilerplate (and when not)

This boilerplate is not universal — no boilerplate is. It is a **bet**, and knowing the bet is what lets you reuse it fast instead of fighting it. Read this before starting any new project on top of it.

## The bet, in one sentence

> This is a base for **B2B, multi-tenant SaaS built around teams** — an `Organization` owns the data, users are `Member`s of it, and billing is one Stripe customer per organization, priced by subscription/seats.

That bet matches roughly **80% of new SaaS projects** (B2B team products dominate; consumer is a shrinking minority; marketplaces/social are specialized). So the goal is never "make it cover everything" — it is: **keep the org model as the spine, and adapt each project by _additive_ debt, never by rewrite.**

## The one concept that decides everything: additive vs structural debt

Every project you put on this base carries some mismatch. There are only two kinds, and they cost wildly different amounts:

|               | **Additive debt** (cheap)                                                   | **Structural debt** (expensive)                                                                                                    |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| What it is    | Machinery that sits there unused (audit logs, invites, seats, org switcher) | The wrong _shape_ woven into every query, guard, and `where` clause                                                                |
| What it costs | A bit of dead code you carry and hide. No rewrite.                          | You either bend the domain into org-scoping (friction on every file) or bypass the org layer entirely (the base works against you) |
| You pay it    | Once, at setup                                                              | Continuously, on every future feature                                                                                              |
| Verdict       | ✅ Fine — accept it                                                         | ❌ Don't — pick a different base                                                                                                   |

The whole guide below is just: **tell these two apart _before_ you commit.**

## The two questions to ask before each project

### Question 1 — Who owns the core data?

This is the load-bearing question, because the org model assumes "one entity owns resources."

- **A team / company / account** (even a solo "team of one") → ✅ **Native fit**. The `Organization` _is_ that account. This is the target.
- **Each individual user owns their own data** (classic B2C) → 🟡 **Additive fit**. Ownership is still single-entity — just always a team of one. Every `where: { organizationId }` maps cleanly to "this user's stuff." You carry the org layer but keep it invisible.
- **The data is multi-party or a relationship graph** (buyer ↔ seller, follower ↔ followed, match ↔ match) → ❌ **Structural misfit**. "An org owns the resource" cannot represent a two-sided transaction or a social graph. Org-scoping fights the domain on every query.

### Question 2 — How do you bill?

The billing is org-scoped, subscription/seat-shaped (`StripeCustomer` 1:1 with org, `Subscription` model, `seatsIncluded`, `membershipLimit`).

- **Subscription / per-seat** → ✅ **Native**. Still the most common model (~57% of SaaS primary).
- **Hybrid** (base plan + metered usage on top) → 🟡 **Additive extension** (~1–2 weeks, when a project actually sells it). See [Adding usage billing](#adding-usage-billing-when-a-project-needs-it).
- **Pure usage / metered-only, no seats** → ⚠️ Possible but **subtractive** (you'd rip out the seat logic that's woven into auth + webhook + members). Only do this for a genuinely metered-only product (AI API, infra). Otherwise prefer hybrid.

## The decision tree

```
Who owns the core data?
│
├─ A team / company / account (even a solo "team of one")
│     └─ How do you bill?
│          ├─ Subscription / per-seat ......... ✅ NATIVE — use as-is
│          └─ Usage / metered ................. ✅ + 🟡 add usage billing (~1–2 wk, additive)
│
├─ Each individual user owns their OWN data (B2C)
│     └─ 🟡 ADDITIVE — use it, keep the org invisible
│
└─ The data is multi-party / a relationship graph
   (marketplace, social network, dating, open two-sided platform)
      └─ ❌ MISFIT — pick a different base; this one fights your domain
```

## Concrete examples (this is where it stops being fuzzy)

| Product idea                                              | Who owns data            | Billing              | Verdict                     | Why                                                                           | What it costs you                           |
| --------------------------------------------------------- | ------------------------ | -------------------- | --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| Team CRM / sales tool                                     | The company              | Per-seat             | ✅ Native                   | Org = company, Member = seat. The exact target.                               | ~0                                          |
| Project management (Linear-like)                          | The team                 | Per-seat             | ✅ Native                   | Org = workspace, invites + seats already built.                               | ~0                                          |
| Invoicing app for freelancers                             | The account (often solo) | Subscription         | ✅ Native                   | A solo user is a team of one; still an "account."                             | ~0 (optionally hide the invite UI)          |
| Internal tool / admin panel for one company               | The company              | Flat/subscription    | ✅ Native                   | Single tenant, role-based access — already there.                             | ~0                                          |
| Personal notes app (Bear-like)                            | Each individual          | Subscription         | 🟡 Additive                 | Each user owns their notes; no team concept.                                  | Hide the org; carry unused invite/seat code |
| Habit tracker                                             | Each individual          | Free / subscription  | 🟡 Additive                 | Pure personal data.                                                           | Hide the org                                |
| Personal budgeting app                                    | Each individual          | Subscription         | 🟡 Additive                 | Personal data, no sharing.                                                    | Hide the org                                |
| Online course platform — **one school** (Teachable-style) | The school (tenant)      | Subscription         | ✅ Native                   | The school is the org; students are members.                                  | ~0                                          |
| AI writing tool for teams                                 | The team                 | Seat (+ maybe usage) | ✅ Native (+ 🟡 if metered) | Org anchors the team; add usage only if you meter tokens.                     | ~0, or +1–2 wk for usage                    |
| AI API / dev tool billed by tokens                        | The account              | Metered              | ✅ arch + 🟡 billing        | Org is the perfect billing anchor; billing needs meters.                      | +1–2 wk usage billing                       |
| Analytics billed per event volume                         | The account              | Hybrid               | ✅ arch + 🟡 billing        | Same: architecture fits, billing shape doesn't.                               | +1–2 wk usage billing                       |
| Freelance marketplace (Malt / Upwork)                     | Buyer ↔ seller           | Take-rate/commission | ❌ Misfit                   | The core object is a two-sided transaction, not an org-owned resource.        | Structural — pick another base              |
| Social network / niche community                          | A relationship graph     | Ads / subscription   | ❌ Misfit                   | Content is a graph of follows/likes; org-scoping fights every query.          | Structural — pick another base              |
| Dating app                                                | Multi-party graph        | Subscription         | ❌ Misfit                   | Matches are relationships between users, not owned resources.                 | Structural — pick another base              |
| Open course **marketplace** (Udemy-style)                 | Instructors ↔ students   | Take-rate            | ❌ Misfit                   | Many-to-many marketplace, not a tenant. Contrast the single-school row above. | Structural — pick another base              |

> Note the two course rows: **one school = a tenant (native)**; **an open marketplace of many instructors and students = a misfit.** Same "industry," opposite verdict — because the _ownership shape_ differs, not the topic. That is the whole point.

## The costs of each path (what "the moves" actually are)

**✅ Native — cost ~0.** Use the base as-is. Ship.

**🟡 Additive (B2C) — cost = a little dead code + the discipline to hide the org.** The move: don't _delete_ the org layer, keep it **invisible**. Concretely:

- Don't mount `<OrgSwitcher>` in the sidebar (or gate it out).
- Don't expose the members / invitations / seats UI.
- Mentally rename `Organization` → "the user's account." The personal org auto-created at signup (`databaseHooks.user.create.after` → `createOrganization`) is all you need — every user already gets exactly one.
- Leave `seatsIncluded` at 1. Leave audit logs on or ignore them.

Result: a working B2C app, zero rewrite, and you keep the _option_ to turn teams on later for free.

**🟡 Additive (usage billing) — cost ≈ 1–2 weeks, only when a project sells it.** Don't pre-build it. See below.

**❌ Structural misfit — cost = negative. Do not use this base.** Forcing a marketplace/social/graph onto org-scoping means either fighting `where: { organizationId }` on every query or bypassing the org layer entirely — at which point the boilerplate's core abstraction is actively misleading the design. The move here is _not_ a workaround; it's choosing a different starting point.

## Adding usage billing (when a project needs it)

The one future-facing extension worth knowing, because the market is drifting from per-seat toward hybrid. It is **additive**: keep the subscription/seat base, add a metered dimension on top (Stripe Billing Meters).

### Two independent levers — don't conflate them

The single most common confusion here is mixing up _who owns the data_ with _how you bill_. They are **two separate switches**, and every combination is valid:

|                        | Licensed (fixed)                   | Metered (usage)                   |
| ---------------------- | ---------------------------------- | --------------------------------- |
| **Team (org visible)** | Slack, Linear — per seat ← default | Datadog — team pays by volume     |
| **Solo (org hidden)**  | Bear notes — flat B2C sub          | A personal AI tool billed per run |

Crucially: **the org is present in all four cells.** "No seats" (a billing choice) does **not** mean "no org" (a tenancy choice) — it only removes the _member cap_. You never pick "org vs no org"; you always have the org, and you independently choose (a) show it or hide it, and (b) fixed or usage billing.

### Licensed vs metered — how Stripe actually bills

"A subscription" is not one thing. Every Stripe subscription attaches one or more **prices**, and a price has a _billing scheme_ that decides how the amount is computed. There are two, and the difference is everything:

- **Licensed** (what this base uses today): a **fixed** amount per period, optionally × quantity. Stripe knows the amount in advance and charges it automatically — €10 × 5 seats = €50/month, every month, with **zero code from you**. This is why billing "just works" here: you never send Stripe an amount, the price is fixed.
- **Metered**: the amount is **not known in advance** — it depends on how much the customer used. **Stripe cannot see your product's usage.** Your code must _report_ it (send meter events) as consumption happens; at period end Stripe sums what you reported × unit price and charges that.

The utility-bill analogy makes it click:

> A flat Netflix plan is **licensed** — same price every month, the provider needs nothing from you.
> An electricity bill is **metered** — the price depends on kWh, and the provider only knows your usage because **a meter reports it**. In Stripe, **the meter is your code.** Report nothing → Stripe bills €0, because it has no idea what happened in your app.

So "it's a paid subscription and Stripe knows" is true for **licensed** and false for **metered**: the moment you go usage-based, _you_ become responsible for feeding Stripe the numbers. That reporting is the real work — and the domain-specific part.

**"Two plans" is imprecise — it's one subscription with two price lines.** Hybrid = a licensed base line (fixed) **+** a metered line (variable overage) on the _same_ subscription. Pure usage = one metered line. Seat = one licensed line.

- **Don't build it "just in case."** Add it the day a project actually charges by usage. (`CLAUDE.md`: no abstraction for one usage, no feature nobody asked for.)
- **The plumbing is cheap (~2–3 days):** meter + metered price config, a second subscription line item, a webhook tweak so the seat logic still reads the _base_ price (not the metered item).
- **The real cost is product-specific instrumentation:** a `reportUsage(organizationId, meter, quantity)` service called at every billable action, with idempotency and non-blocking failure. This is why no boilerplate ships usage billing done — the meter ("what do we count?") is domain-specific.
- **MVP first step, minimal blast radius:** one metered add-on price + `reportUsage` + a usage display on the billing page, **without touching seats**. Prove the pattern, then add quotas/overage only if a plan demands it.

### Seat ↔ usage is a config flip, not a rewrite

Both models sit on the **same foundation** — org as tenant, `Member`s, `StripeCustomer`, the webhook skeleton. They differ only in a thin layer:

- **Seat** = a licensed price + seat-cap enforcement (`membershipLimit` in `auth.ts`, `checkSeatCapacity`, seat reconciliation).
- **Usage** = a metered price + usage reporting, cap disabled.

"No seats" does **not** mean "no org" — you keep the team and the billing anchor; you only lift the member cap and swap the price scheme. Switching a _fresh_ project from one to the other is small and mostly **subtractive** (loosen `membershipLimit`, no-op `checkSeatCapacity`, skip reconcile) — not a core refactor.

If you expect to ship both models regularly, add a `type: "seat" | "usage"` discriminant to `PLAN_CONFIG` **when you build usage billing** (~+1 day): `membershipLimit` returns `seatsIncluded` for seat plans and `Infinity` for usage plans; `checkSeatCapacity` no-ops for usage. Then switching is a config flip. Don't build the discriminant before your first usage project (YAGNI).

⚠️ This is about **per-project reuse** (starting fresh). Migrating a **live** product between models is a pricing migration (Stripe proration, grandfathering, customer comms) — an ops cost no architecture removes.

## Rule of thumb

Before each new project, one question decides the base, one decides the billing:

1. **Does the core data have a single owner (a team/account/user)?**
   Yes → this base. No (multi-party/graph) → a different base.
2. **Seat/subscription, or metered?**
   Seat → native. Metered → the ~1–2 week additive extension.

If both land in "yes / native," you start with auth, teams, billing, i18n, and a dashboard already working — and you carry no debt at all. That is the ~80% this base is _for_.
