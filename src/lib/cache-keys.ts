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

// Records the `event.created` timestamp of the `customer.subscription.deleted`
// event for a subscription, so a delayed/out-of-order `subscription.updated`
// (which Stripe may retry for up to 3 days) cannot re-create the row and
// re-grant access after cancellation. TTL must cover Stripe's retry window.
function stripeSubscriptionDeletedCacheKey(subscriptionId: string): string {
  return `stripe:subscription-deleted:${subscriptionId}`;
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
  stripeSubscriptionDeletedCacheKey,
};
