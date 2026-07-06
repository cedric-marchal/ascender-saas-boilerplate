import type {
  PrismaClient,
  SubscriptionStatus,
} from "../../lib/generated/prisma/client";
import { USERS, type UserSeed } from "./auth.seed";
import { daysAgo, daysFromNow, SEED_FILTER, slugify } from "./helpers";
import { DEMO_ORG_A_ID, orgIdForUser } from "./organization.seed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripeCustomerIdForOrg(name: string, userIndex: number): string {
  return `cus_seed_${slugify(name).replace(/-/g, "_")}_${userIndex}`;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STRIPE_PRICE_ID_PRO = "price_seed_pro_monthly";

// Standalone Stripe customer id for the demo showcase org (not tied to a user's
// personal org, so it is not covered by the per-user customer generation above).
const DEMO_ORG_A_STRIPE_CUSTOMER_ID = "cus_seed_demo_org_a";

type SubscriptionSeed = {
  userIndex: number;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
};

// Status distribution for generated subscriptions (weighted, realistic)
const STATUS_DISTRIBUTION: {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: "future" | "past" | "today";
}[] = [
  // ~50% ACTIVE normal
  { status: "ACTIVE", cancelAtPeriodEnd: false, periodEnd: "future" },
  { status: "ACTIVE", cancelAtPeriodEnd: false, periodEnd: "future" },
  { status: "ACTIVE", cancelAtPeriodEnd: false, periodEnd: "future" },
  { status: "ACTIVE", cancelAtPeriodEnd: false, periodEnd: "future" },
  { status: "ACTIVE", cancelAtPeriodEnd: false, periodEnd: "future" },
  // ~10% ACTIVE canceling
  { status: "ACTIVE", cancelAtPeriodEnd: true, periodEnd: "future" },
  // ~10% TRIALING
  { status: "TRIALING", cancelAtPeriodEnd: false, periodEnd: "future" },
  // ~10% CANCELED
  { status: "CANCELED", cancelAtPeriodEnd: false, periodEnd: "past" },
  // ~8% PAST_DUE
  { status: "PAST_DUE", cancelAtPeriodEnd: false, periodEnd: "past" },
  // ~4% INCOMPLETE
  { status: "INCOMPLETE", cancelAtPeriodEnd: false, periodEnd: "future" },
  // ~4% UNPAID
  { status: "UNPAID", cancelAtPeriodEnd: false, periodEnd: "past" },
  // ~4% PAUSED
  { status: "PAUSED", cancelAtPeriodEnd: false, periodEnd: "today" },
];

// Hand-crafted subscriptions for edge case users (indexes 3-16)
const MANUAL_SUBSCRIPTIONS: SubscriptionSeed[] = [
  // ACTIVE — normal
  {
    userIndex: 3,
    stripeSubscriptionId: "sub_seed_thomas_active",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "ACTIVE",
    currentPeriodStart: daysAgo(15),
    currentPeriodEnd: daysFromNow(15),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(90),
  },
  // ACTIVE — canceling at period end
  {
    userIndex: 4,
    stripeSubscriptionId: "sub_seed_marine_active_canceling",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "ACTIVE",
    currentPeriodStart: daysAgo(10),
    currentPeriodEnd: daysFromNow(20),
    cancelAtPeriodEnd: true,
    createdAt: daysAgo(75),
  },
  // TRIALING
  {
    userIndex: 5,
    stripeSubscriptionId: "sub_seed_lucas_trialing",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "TRIALING",
    currentPeriodStart: daysAgo(7),
    currentPeriodEnd: daysFromNow(7),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(7),
  },
  // CANCELED — period ended
  {
    userIndex: 6,
    stripeSubscriptionId: "sub_seed_camille_canceled",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "CANCELED",
    currentPeriodStart: daysAgo(60),
    currentPeriodEnd: daysAgo(30),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(120),
  },
  // PAST_DUE — payment failed
  {
    userIndex: 7,
    stripeSubscriptionId: "sub_seed_antoine_pastdue",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "PAST_DUE",
    currentPeriodStart: daysAgo(35),
    currentPeriodEnd: daysAgo(5),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(60),
  },
  // ACTIVE — boundary min user
  {
    userIndex: 11,
    stripeSubscriptionId: "sub_seed_ab_active",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "ACTIVE",
    currentPeriodStart: daysAgo(3),
    currentPeriodEnd: daysFromNow(27),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(5),
  },
  // ACTIVE — boundary max user
  {
    userIndex: 12,
    stripeSubscriptionId: "sub_seed_jb_rochefoucauld_active",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "ACTIVE",
    currentPeriodStart: daysAgo(20),
    currentPeriodEnd: daysFromNow(10),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(365),
  },
  // No subscription for user 13 (abandoned checkout)
  // INCOMPLETE — payment not yet confirmed
  {
    userIndex: 14,
    stripeSubscriptionId: "sub_seed_hugo_incomplete",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "INCOMPLETE",
    currentPeriodStart: daysAgo(1),
    currentPeriodEnd: daysFromNow(29),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(1),
  },
  // UNPAID — multiple payment failures
  {
    userIndex: 15,
    stripeSubscriptionId: "sub_seed_lea_unpaid",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "UNPAID",
    currentPeriodStart: daysAgo(45),
    currentPeriodEnd: daysAgo(15),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(200),
  },
  // PAUSED
  {
    userIndex: 16,
    stripeSubscriptionId: "sub_seed_nathan_paused",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "PAUSED",
    currentPeriodStart: daysAgo(30),
    currentPeriodEnd: daysAgo(0),
    cancelAtPeriodEnd: false,
    createdAt: daysAgo(100),
  },
];

// Users with manual subscriptions (skip in generation)
const MANUAL_SUB_INDEXES = new Set(
  MANUAL_SUBSCRIPTIONS.map(
    (subscription: SubscriptionSeed) => subscription.userIndex,
  ),
);

// Users with Stripe customer but explicitly no subscription (abandoned checkout)
const NO_SUB_INDEXES = new Set([13]);

function generateSubscriptions(): SubscriptionSeed[] {
  const generatedUsersWithStripe = USERS.filter(
    (user: UserSeed) =>
      user.hasStripeCustomer &&
      !MANUAL_SUB_INDEXES.has(user.index) &&
      !NO_SUB_INDEXES.has(user.index),
  );

  return generatedUsersWithStripe.map(
    (user: UserSeed, index: number): SubscriptionSeed => {
      const distribution =
        STATUS_DISTRIBUTION[index % STATUS_DISTRIBUTION.length]!;

      const periodDays = 15 + (index % 15);
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;

      if (distribution.periodEnd === "future") {
        currentPeriodStart = daysAgo(periodDays);
        currentPeriodEnd = daysFromNow(30 - periodDays);
      } else if (distribution.periodEnd === "past") {
        currentPeriodStart = daysAgo(periodDays + 30);
        currentPeriodEnd = daysAgo(periodDays);
      } else {
        currentPeriodStart = daysAgo(30);
        currentPeriodEnd = daysAgo(0);
      }

      return {
        userIndex: user.index,
        stripeSubscriptionId: `sub_seed_gen_${user.index}`,
        stripePriceId: STRIPE_PRICE_ID_PRO,
        status: distribution.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: distribution.cancelAtPeriodEnd,
        createdAt: user.createdAt,
      };
    },
  );
}

const SUBSCRIPTIONS: SubscriptionSeed[] = [
  ...MANUAL_SUBSCRIPTIONS,
  ...generateSubscriptions(),
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedBilling(prisma: PrismaClient): Promise<void> {
  // Stripe Customers — keyed to organizationId
  const usersWithStripe = USERS.filter(
    (user: UserSeed) => user.hasStripeCustomer,
  );

  for (const user of usersWithStripe) {
    await prisma.stripeCustomer.create({
      data: {
        id: `seed-stripe-customer-${user.index}`,
        organizationId: orgIdForUser(user.index),
        stripeCustomerId: stripeCustomerIdForOrg(user.name, user.index),
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      },
    });
  }

  // Demo Org A is the multi-member showcase org that owns the projects list.
  // The "projects" feature is plan-gated (page guard + write actions both
  // require an ACTIVE subscription), so the org needs a real pro subscription —
  // otherwise the seeded projects are unreachable and cannot be mutated.
  await prisma.stripeCustomer.create({
    data: {
      id: "seed-stripe-customer-demo-org-a",
      organizationId: DEMO_ORG_A_ID,
      stripeCustomerId: DEMO_ORG_A_STRIPE_CUSTOMER_ID,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
  });

  await prisma.subscription.create({
    data: {
      id: "seed-subscription-demo-org-a",
      stripeSubscriptionId: "sub_seed_demo_org_a_active",
      stripeCustomerId: DEMO_ORG_A_STRIPE_CUSTOMER_ID,
      stripePriceId: STRIPE_PRICE_ID_PRO,
      status: "ACTIVE",
      currentPeriodStart: daysAgo(30),
      currentPeriodEnd: daysFromNow(30),
      cancelAtPeriodEnd: false,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
  });

  // Subscriptions
  for (const subscription of SUBSCRIPTIONS) {
    const matchingUser = USERS.find(
      (entry: UserSeed) => entry.index === subscription.userIndex,
    );

    if (!matchingUser) {
      throw new Error(`No user found for index ${subscription.userIndex}`);
    }

    if (!matchingUser.hasStripeCustomer) {
      throw new Error(
        `User ${matchingUser.name} (index ${matchingUser.index}) has a subscription but hasStripeCustomer is false`,
      );
    }

    await prisma.subscription.create({
      data: {
        id: `seed-subscription-${subscription.userIndex}`,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: stripeCustomerIdForOrg(
          matchingUser.name,
          matchingUser.index,
        ),
        stripePriceId: subscription.stripePriceId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.createdAt,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Clean (children first for FK safety)
// ---------------------------------------------------------------------------

async function cleanBilling(prisma: PrismaClient): Promise<void> {
  await prisma.subscription.deleteMany(SEED_FILTER);
  await prisma.stripeCustomer.deleteMany(SEED_FILTER);
}

export { cleanBilling, seedBilling };
