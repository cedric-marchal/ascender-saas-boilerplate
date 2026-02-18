import { SubscriptionStatus } from "@/lib/generated/prisma/client";

export type { SubscriptionStatus } from "@/lib/generated/prisma/client";

const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  incomplete: "Incomplet",
  incomplete_expired: "Expiré",
  trialing: "Essai",
  active: "Actif",
  past_due: "En retard",
  canceled: "Annulé",
  unpaid: "Impayé",
  paused: "En pause",
};

const ALL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
];

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
];

export {
  ACTIVE_SUBSCRIPTION_STATUSES,
  ALL_SUBSCRIPTION_STATUSES,
  subscriptionStatusLabels,
};
