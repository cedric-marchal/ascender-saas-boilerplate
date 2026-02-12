import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";

type BillingInvoice = {
  id: string;
  number: string | null;
  status: "draft" | "open" | "paid" | "uncollectible" | "void" | null;
  created: number;
  amountPaid: number | null;
  paidAt: number | null;
  invoicePdfUrl: string | null;
};

type BillingSubscription = {
  id: string;
  status: Stripe.Subscription.Status;
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
  subscription: Stripe.Subscription
): BillingSubscription {
  const subscriptionItem = subscription.items.data[0];

  return {
    id: subscription.id,
    status: subscription.status,
    currentPeriodStart: subscriptionItem?.current_period_start ?? 0,
    currentPeriodEnd: subscriptionItem?.current_period_end ?? 0,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ?? null,
    priceId: subscriptionItem?.price?.id ?? null,
  };
}

async function getBilling(userId: string): Promise<GetBillingResult | null> {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!stripeCustomer) {
    return null;
  }

  const invoicesCacheKey = `invoices:${userId}`;
  const cachedInvoices = await redis.get<BillingInvoice[]>(invoicesCacheKey);

  let invoices: BillingInvoice[];

  if (cachedInvoices) {
    invoices = cachedInvoices;
  } else {
    const { data: fetchedInvoices } = await stripe.invoices.list({
      customer: stripeCustomer.stripeCustomerId,
      limit: 100,
    });
    invoices = fetchedInvoices.map((invoice: Stripe.Invoice) =>
      mapInvoice(invoice)
    );
    await redis.set(invoicesCacheKey, invoices, { ex: 300 });
  }

  const { data: fetchedSubscriptions } = await stripe.subscriptions.list({
    customer: stripeCustomer.stripeCustomerId,
    limit: 100,
  });

  const subscriptions = fetchedSubscriptions.map(
    (subscription: Stripe.Subscription) => mapSubscription(subscription)
  );

  return { invoices, subscriptions };
}

export { getBilling };

export type { BillingInvoice, BillingSubscription, GetBillingResult };
