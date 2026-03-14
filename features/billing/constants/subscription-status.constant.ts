import { SubscriptionStatus } from "@/lib/generated/prisma/browser";

const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  INCOMPLETE: "Incomplet",
  INCOMPLETE_EXPIRED: "Expiré",
  TRIALING: "Essai",
  ACTIVE: "Actif",
  PAST_DUE: "En retard",
  CANCELED: "Annulé",
  UNPAID: "Impayé",
  PAUSED: "En pause",
};

const ALL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.INCOMPLETE,
  SubscriptionStatus.INCOMPLETE_EXPIRED,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.CANCELED,
  SubscriptionStatus.UNPAID,
  SubscriptionStatus.PAUSED,
];

// PAST_DUE is included because Stripe keeps the subscription internally active
// even when payment failed — the subscription hasn't been canceled yet.
// We show a warning in the UI but grant feature access until explicitly canceled.
const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

// Stripe's documented subscription status values (lowercase, as sent by the API).
// Using a typed Record ensures exhaustive mapping: TypeScript errors if any key is missing.
const STRIPE_SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

type StripeSubscriptionStatus = (typeof STRIPE_SUBSCRIPTION_STATUSES)[number];

const STRIPE_TO_DB_SUBSCRIPTION_STATUS: Record<
  StripeSubscriptionStatus,
  SubscriptionStatus
> = {
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
  paused: SubscriptionStatus.PAUSED,
};

export {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ALL_SUBSCRIPTION_STATUSES,
  STRIPE_TO_DB_SUBSCRIPTION_STATUS,
  STRIPE_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
};
export type { StripeSubscriptionStatus };
