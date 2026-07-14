import { Link } from "@/i18n/navigation";

type TermsOfServiceContentEnProps = {
  appName: string;
};

/**
 * English translation of `terms-of-service-content.fr.tsx`.
 */
function TermsOfServiceContentEn({ appName }: TermsOfServiceContentEnProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <section>
        <h2>Scope</h2>
        <p>
          These terms of service ("Terms") govern access to and use of the{" "}
          {appName} service ("the service") made available by [Company name]
          ("we", "the provider").
        </p>
        <p>
          By accessing the service, you ("the user") accept these Terms in full.
          If you do not agree to these Terms, you must stop using the service.
        </p>
      </section>

      <section>
        <h2>Account creation</h2>
        <p>
          Access to the service requires creating a user account. To create an
          account, you must:
        </p>
        <ul>
          <li>be of legal age, i.e. at least 18 years old</li>
          <li>
            provide accurate, complete, and up-to-date information (name, valid
            email address)
          </li>
          <li>use only one email address per account</li>
        </ul>
        <p>
          You are responsible for the confidentiality of your login credentials
          and for any action performed through your account. You must notify us
          immediately of any unauthorized access to your account.
        </p>
      </section>

      <section>
        <h2>User obligations</h2>
        <p>By using the service, you agree to:</p>
        <ul>
          <li>comply with applicable laws and regulations</li>
          <li>not alter, compromise, or interrupt the service's operation</li>
          <li>
            not attempt to access data or systems for which you have no
            authorization
          </li>
          <li>not impersonate another person or entity</li>
          <li>not use the service for illegal or harmful purposes</li>
        </ul>
      </section>

      <section>
        <h2>Prohibited uses</h2>
        <p>It is prohibited to use the service for:</p>
        <ul>
          <li>
            any illegal activity, including fraud, money laundering, or
            terrorist financing
          </li>
          <li>
            harassment, threats, intimidation, or any discriminatory behavior
          </li>
          <li>
            sending unsolicited communications (spam) or distributing malicious
            content
          </li>
          <li>infringing third-party intellectual property rights</li>
          <li>
            collecting or scraping data from the service by unauthorized
            automated means
          </li>
          <li>
            any action likely to compromise the security or integrity of the
            service
          </li>
        </ul>
      </section>

      <section>
        <h2>User content and data</h2>
        <p>
          You are solely responsible for the content you create, publish, or
          transmit through the service. You represent that you hold all
          necessary rights to this content and that its use does not violate any
          law or regulation.
        </p>
        <p>
          By submitting content to the service, you grant us a non-exclusive,
          worldwide, royalty-free license, for the duration of your use of the
          service, to process this content solely for the purpose of providing
          the service.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The service, including its interface, logos, original content, and
          features, is protected by intellectual property rights. You may not
          copy, modify, reproduce, reverse-engineer, decompile, or create
          derivative works from the service.
        </p>
        <p>
          We grant you a personal, non-exclusive, non-transferable, and
          revocable license to use the service in accordance with these Terms.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          The service is provided "as is", without warranty of any kind, whether
          express or implied. We make no warranty regarding the quality, fitness
          for a particular purpose, reliability, or performance of the service.
        </p>
        <p>
          To the extent permitted by applicable law, we are not liable for
          indirect, special, or consequential damages resulting from your use of
          the service, including data loss, loss of profits, or business
          interruption.
        </p>
        <p>
          Our total liability to you shall not exceed the total amount you paid
          for the service during the twelve months preceding the event giving
          rise to the claim.
        </p>
      </section>

      <section>
        <h2>Suspension and termination</h2>
        <p>
          We may suspend or terminate your account, at our discretion, in the
          event of a serious breach of these Terms, harm caused to other users
          or to the service, or illegal activity.
        </p>
        <p>
          You may terminate your account at any time through your account
          settings or by contacting us. Upon termination, your access to the
          service will be revoked and your data processed in accordance with our{" "}
          <Link href="/privacy-policy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>Changes to these Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. In the event
          of a material change, we will notify you by email or via a
          notification on the service at least 30 days before the new terms take
          effect.
        </p>
        <p>
          Your continued use of the service after the change constitutes
          acceptance of the new Terms. If you do not accept the changes, you
          must stop using the service before the effective date.
        </p>
      </section>

      <section>
        <h2>Governing law and jurisdiction</h2>
        <p>
          These Terms are governed by French law. In the event of a dispute, you
          and we agree to submit to the jurisdiction of the courts of [City of
          registered office], excluding any conflicting agreement.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question relating to these terms of service, you can contact
          us:
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

export { TermsOfServiceContentEn };
