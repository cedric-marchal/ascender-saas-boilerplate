import "server-only";

import { getStaticPathname } from "@/i18n/get-static-pathname";
import { getTranslator } from "@/i18n/get-translator";
import type { Locale } from "next-intl";

import { SeatLimitExceededEmail } from "@/features/billing/emails/seat-limit-exceeded-email";

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/resend";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

type SendSeatLimitExceededEmailInput = {
  email: string;
  organizationName: string;
  memberCount: number;
  seatCap: number;
  locale: Locale;
};

/**
 * Sent from the Stripe webhook (`customer.subscription.updated` /
 * `customer.subscription.deleted`) when a downgrade or cancellation leaves an
 * organization over its new seat cap. Mirrors `sendPaymentFailedEmail`: uses
 * `sendEmail` (throws on failure) so a failed send bubbles up to the webhook
 * handler and returns 5xx, letting Stripe retry the event rather than
 * silently dropping the notice.
 */
async function sendSeatLimitExceededEmail(
  input: SendSeatLimitExceededEmailInput,
): Promise<void> {
  const organizationPathname = getStaticPathname(
    "/dashboard/organization",
    input.locale,
  );
  const organizationLink = `${env.NEXT_PUBLIC_BASE_URL}${organizationPathname}`;
  const translate = getTranslator(input.locale);

  await sendEmail({
    from: `${translate("emails.common.noreplyFromName", { appName: APP_NAME })} <${env.RESEND_EMAIL_NOREPLY}>`,
    to: input.email,
    subject: translate("emails.seatLimitExceeded.subject", {
      appName: APP_NAME,
      organizationName: input.organizationName,
    }),
    react: SeatLimitExceededEmail({
      organizationName: input.organizationName,
      memberCount: input.memberCount,
      seatCap: input.seatCap,
      organizationLink,
      locale: input.locale,
    }),
  });
}

export { sendSeatLimitExceededEmail };
export type { SendSeatLimitExceededEmailInput };
