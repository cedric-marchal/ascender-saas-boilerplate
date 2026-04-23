import "server-only";

import type Stripe from "stripe";

import type { InvoiceStatus } from "@/features/billing/constants/invoice-status.constant";
import { STRIPE_TO_DB_SUBSCRIPTION_STATUS } from "@/features/billing/constants/subscription-status.constant";

import {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
} from "@/lib/cache-keys";
import { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

type BillingInvoiceStatus = InvoiceStatus | null;

type BillingInvoice = {
  id: string;
  number: string | null;
  status: BillingInvoiceStatus;
  created: number;
  amountPaid: number | null;
  paidAt: number | null;
  invoicePdfUrl: string | null;
};

type BillingSubscription = {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  priceId: string | null;
};

type GetBillingResult = {
  invoices: BillingInvoice[];
  subscriptions: BillingSubscription[];
};

function mapInvoice(invoice: Stripe.Invoice): BillingInvoice {
  return {
    id: invoice.id,
    number: invoice.number ?? null,
    status: invoice.status ?? null,
    created: invoice.created,
    amountPaid: invoice.amount_paid ?? null,
    paidAt: invoice.status_transitions?.paid_at ?? null,
    invoicePdfUrl: invoice.invoice_pdf ?? null,
  };
}

function mapSubscription(
  subscription: Stripe.Subscription,
): BillingSubscription {
  const subscriptionItem = subscription.items.data[0];

  return {
    id: subscription.id,
    status:
      (
        STRIPE_TO_DB_SUBSCRIPTION_STATUS as Record<
          string,
          SubscriptionStatus | undefined
        >
      )[subscription.status] ?? SubscriptionStatus.CANCELED,
    currentPeriodStart: subscriptionItem?.current_period_start ?? 0,
    currentPeriodEnd: subscriptionItem?.current_period_end ?? 0,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ?? null,
    priceId: subscriptionItem?.price?.id ?? null,
  };
}

async function fetchInvoices(
  stripeCustomerId: string,
  userId: string,
): Promise<BillingInvoice[]> {
  const cacheKey = billingInvoicesCacheKey(userId);
  const cached = await redis.get<BillingInvoice[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const { data } = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit: 100,
  });

  const invoices = data.map((invoice: Stripe.Invoice) => mapInvoice(invoice));
  await redis.set(cacheKey, invoices, { ex: 300 });

  return invoices;
}

async function fetchSubscriptions(
  stripeCustomerId: string,
  userId: string,
): Promise<BillingSubscription[]> {
  const cacheKey = billingSubscriptionsCacheKey(userId);
  const cached = await redis.get<BillingSubscription[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const { data } = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 100,
  });

  const subscriptions = data.map((subscription: Stripe.Subscription) =>
    mapSubscription(subscription),
  );
  await redis.set(cacheKey, subscriptions, { ex: 300 });

  return subscriptions;
}

async function getBilling(userId: string): Promise<GetBillingResult | null> {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: {
      userId,
    },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!stripeCustomer) {
    return null;
  }

  const [invoices, subscriptions] = await Promise.all([
    fetchInvoices(stripeCustomer.stripeCustomerId, userId),
    fetchSubscriptions(stripeCustomer.stripeCustomerId, userId),
  ]);

  return {
    invoices,
    subscriptions,
  };
}

export { getBilling };

export type { BillingInvoice, BillingSubscription, GetBillingResult };
