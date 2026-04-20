import "server-only";

function billingInvoicesCacheKey(userId: string): string {
  return `invoices:${userId}`;
}

function billingSubscriptionsCacheKey(userId: string): string {
  return `subscriptions:${userId}`;
}

function stripeEventIdempotencyCacheKey(eventId: string): string {
  return `stripe:event:${eventId}`;
}

export {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
  stripeEventIdempotencyCacheKey,
};
