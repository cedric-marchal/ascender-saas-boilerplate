import type {
  PrismaClient,
  SubscriptionStatus,
} from "../../lib/generated/prisma/client";
import { USERS, type UserSeed } from "./auth.seed";
import { daysAgo, daysFromNow, SEED_FILTER, seedId, slugify } from "./helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripeCustomerIdForUser(name: string): string {
  return `cus_seed_${slugify(name).replace(/-/g, "_")}`;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STRIPE_PRICE_ID_PRO = "price_seed_pro_monthly";

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

const SUBSCRIPTIONS: SubscriptionSeed[] = [
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
  {
    userIndex: 4,
    stripeSubscriptionId: "sub_seed_marine_active",
    stripePriceId: STRIPE_PRICE_ID_PRO,
    status: "ACTIVE",
    currentPeriodStart: daysAgo(10),
    currentPeriodEnd: daysFromNow(20),
    cancelAtPeriodEnd: true,
    createdAt: daysAgo(75),
  },
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
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedBilling(prisma: PrismaClient): Promise<void> {
  // Stripe Customers
  const usersWithStripe = USERS.filter(
    (user: UserSeed) => user.hasStripeCustomer,
  );

  for (const user of usersWithStripe) {
    await prisma.stripeCustomer.create({
      data: {
        id: `seed-stripe-customer-${user.index}`,
        userId: seedId("user", user.index),
        stripeCustomerId: stripeCustomerIdForUser(user.name),
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      },
    });
  }

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
        stripeCustomerId: stripeCustomerIdForUser(matchingUser.name),
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
