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

function paymentFailedEmailCacheKey(invoiceId: string): string {
  return `stripe:payment-failed-email:${invoiceId}`;
}

// Keyed on org + seat cap (not the subscription id): re-notifies the owner
// whenever the cap changes again (e.g. a further downgrade), while a
// renewal at the same cap within the TTL window stays silent.
function seatLimitExceededEmailCacheKey(
  organizationId: string,
  seatCap: number,
): string {
  return `stripe:seat-limit-exceeded-email:${organizationId}:${seatCap}`;
}

function orgMembersCacheKey(organizationId: string): string {
  return `members:org:${organizationId}`;
}

export {
  billingInvoicesCacheKey,
  billingSubscriptionsCacheKey,
  orgMembersCacheKey,
  paymentFailedEmailCacheKey,
  seatLimitExceededEmailCacheKey,
  stripeEventIdempotencyCacheKey,
};
