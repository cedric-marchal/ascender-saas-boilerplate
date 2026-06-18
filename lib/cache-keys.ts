import "server-only";

function billingInvoicesCacheKey(organizationId: string): string {
  return `invoices:org:${organizationId}`;
}

function billingSubscriptionsCacheKey(organizationId: string): string {
  return `subscriptions:org:${organizationId}`;
}

function stripeEventIdempotencyCacheKey(eventId: string): string {
  return `stripe:event:${eventId}`;
}

export {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
  stripeEventIdempotencyCacheKey,
};
