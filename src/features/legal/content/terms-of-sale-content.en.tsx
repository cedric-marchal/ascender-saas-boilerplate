import { Link } from "@/i18n/navigation";

type TermsOfSaleContentEnProps = {
  appName: string;
};

/**
 * English translation of `terms-of-sale-content.fr.tsx`.
 */
function TermsOfSaleContentEn({ appName }: TermsOfSaleContentEnProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <section>
        <h2>Scope</h2>
        <p>
          These terms of sale ("Terms") govern any commercial transaction made
          on the {appName} site ("the site"), operated by [Company name] ("the
          provider").
        </p>
        <p>
          These Terms must be read together with the{" "}
          <Link
            href="/terms-of-service"
            className="underline underline-offset-4"
          >
            terms of service
          </Link>
          . In the event of a conflict between the two documents, these Terms
          prevail on commercial matters.
        </p>
      </section>

      <section>
        <h2>Description of offers</h2>
        <p>
          The {appName} service is offered as ongoing subscriptions. Available
          plans and their features are described on our{" "}
          <Link href="/pricing" className="underline underline-offset-4">
            pricing page
          </Link>
          .
        </p>
        <p>
          The provider reserves the right to modify any offer at any time.
          Changes do not affect active subscriptions until their renewal date.
        </p>
      </section>

      <section>
        <h2>Prices and billing</h2>
        <p>
          Prices are shown in euros, all taxes included. Billing is carried out
          according to the frequency chosen at subscription (monthly or annual).
        </p>
        <p>
          An invoice is issued automatically at each subscription renewal.
          Invoices are available in the "Billing" section of your account.
        </p>
      </section>

      <section>
        <h2>Payment methods</h2>
        <p>
          Payments are processed by our payment provider, Stripe. Accepted
          payment methods are:
        </p>
        <ul>
          <li>credit card (Visa, Mastercard, American Express)</li>
        </ul>
        <p>
          You are responsible for ensuring your payment method remains valid. In
          case of payment failure, you will be notified and your access to the
          service may be suspended until the situation is resolved.
        </p>
      </section>

      <section>
        <h2>Renewal and duration</h2>
        <p>
          The subscription automatically renews at the end of each billing
          period unless cancelled beforehand. A renewal reminder email is sent 7
          days before the billing date.
        </p>
        <p>
          In the event of a price change, you will be notified at least 30 days
          before the new price takes effect. You may cancel your subscription
          before that date if you do not accept the new pricing.
        </p>
      </section>

      <section>
        <h2>Cancellation</h2>
        <p>
          You may cancel your subscription at any time from your account
          settings or via the Stripe customer portal. Cancellation takes effect
          at the end of the current billing period. You will keep full access to
          the service until that date.
        </p>
        <p>
          The provider may also terminate the subscription in the event of a
          serious breach of the{" "}
          <Link
            href="/terms-of-service"
            className="underline underline-offset-4"
          >
            terms of service
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>Refunds</h2>
        <p>
          Generally, payments made for a subscription are non-refundable. The
          following exceptions apply:
        </p>
        <ul>
          <li>
            a billing error on our part identified within 30 days of the
            transaction
          </li>
          <li>
            a serious technical incident on our end making the service
            unavailable for a significant period
          </li>
        </ul>
        <p>
          To request a refund, please contact us within 30 days of the
          transaction in question.
        </p>
      </section>

      <section>
        <h2>Taxes and VAT</h2>
        <p>
          Displayed prices include applicable VAT based on your country of
          residence, in accordance with European regulations. VAT does not apply
          to customers based outside the European Union.
        </p>
      </section>

      <section>
        <h2>Right of withdrawal</h2>
        <p>
          In accordance with European distance-selling regulations, you have 14
          calendar days from the subscription date to exercise your right of
          withdrawal on a new subscription. This period does not apply to
          automatic renewals.
        </p>
        <p>
          To exercise this right, contact us before the deadline expires. The
          refund will be made within 30 days of receiving your request.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          Our liability is limited in accordance with the provisions of the{" "}
          <Link
            href="/terms-of-service"
            className="underline underline-offset-4"
          >
            terms of service
          </Link>
          . Under no circumstances shall we be held liable for indirect damages
          related to a transaction made through the site.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These Terms are governed by French law. In the event of a dispute
          relating to a transaction, jurisdiction is assigned to the courts of
          [City of registered office].
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question relating to these terms of sale or a transaction, you
          can contact us:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> contact@example.com
          </li>
          <li>
            <strong>Form:</strong>{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Contact page
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export { TermsOfSaleContentEn };
