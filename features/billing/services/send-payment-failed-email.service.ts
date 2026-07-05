import "server-only";

import { getStaticPathname } from "@/i18n/get-static-pathname";
import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";

import { PaymentFailedEmail } from "@/features/billing/emails/payment-failed-email";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/resend";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type SendPaymentFailedEmailInput = {
  email: string;
  organizationName: string;
  locale: Locale;
};

/**
 * Sent from the Stripe webhook (`invoice.payment_failed`). Unlike other
 * transactional emails in this feature set, this uses `sendEmail` (throws on
 * failure) instead of `sendEmailSafe` — a failed send here must bubble up to
 * the webhook handler so it returns 5xx and Stripe retries the event, rather
 * than silently dropping the dunning notice.
 */
async function sendPaymentFailedEmail(
  input: SendPaymentFailedEmailInput,
): Promise<void> {
  const billingPathname = getStaticPathname("/dashboard/billing", input.locale);
  const billingLink = `${env.NEXT_PUBLIC_BASE_URL}${billingPathname}`;
  const translate = getTranslator(input.locale);

  await sendEmail({
    from: `${translate("emails.common.noreplyFromName", { appName: APP_NAME })} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: input.email,
    subject: translate("emails.paymentFailed.subject", {
      appName: APP_NAME,
      organizationName: input.organizationName,
    }),
    react: PaymentFailedEmail({
      organizationName: input.organizationName,
      billingLink,
      locale: input.locale,
    }),
  });
}

export { sendPaymentFailedEmail };
export type { SendPaymentFailedEmailInput };
