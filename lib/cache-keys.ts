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

function orgMembersCacheKey(organizationId: string): string {
  return `members:org:${organizationId}`;
}

export {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
  orgMembersCacheKey,
  stripeEventIdempotencyCacheKey,
};
