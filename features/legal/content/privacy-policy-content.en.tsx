import { Link } from "@/i18n/navigation";

type PrivacyPolicyContentEnProps = {
  appName: string;
};

/**
 * English translation of `privacy-policy-content.fr.tsx`.
 */
function PrivacyPolicyContentEn({ appName }: PrivacyPolicyContentEnProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <section>
        <h2>Introduction</h2>
        <p>
          This privacy policy describes how {appName} ("we", "our", "us")
          collects, uses, and shares your personal information when you use our
          website and services.
        </p>
        <p>
          We are committed to protecting your privacy and processing your
          personal data in accordance with the General Data Protection
          Regulation (GDPR) and applicable French data protection law.
        </p>
      </section>

      <section>
        <h2>Data controller</h2>
        <p>The data controller is:</p>
        <ul>
          <li>
            <strong>Company name:</strong> [Company name]
          </li>
          <li>
            <strong>Address:</strong> [Full address]
          </li>
          <li>
            <strong>Email:</strong> contact@example.com
          </li>
        </ul>
      </section>

      <section>
        <h2>Data we collect</h2>
        <p>We collect the following types of data:</p>

        <h3>Data you provide to us</h3>
        <ul>
          <li>
            <strong>Account information:</strong> name, email address, password
            when you sign up
          </li>
          <li>
            <strong>Profile information:</strong> profile picture, preferences
            (optional)
          </li>
          <li>
            <strong>Communications:</strong> messages sent through the contact
            form
          </li>
          <li>
            <strong>Payment information:</strong> processed securely by our
            provider, Stripe
          </li>
        </ul>

        <h3>Data collected automatically</h3>
        <ul>
          <li>
            <strong>Log data:</strong> IP address, browser type, operating
            system
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, time spent, actions
            taken
          </li>
          <li>
            <strong>Cookies:</strong> see the dedicated section below
          </li>
        </ul>
      </section>

      <section>
        <h2>Purposes of processing</h2>
        <p>Your data is used to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Create and manage your user account</li>
          <li>Process your payments and manage your subscription</li>
          <li>Respond to your requests and provide support</li>
          <li>Send you communications related to the service</li>
          <li>Ensure the security of our platform</li>
          <li>Comply with our legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>Legal basis for processing</h2>
        <p>We process your data on the following legal bases:</p>
        <ul>
          <li>
            <strong>Contract performance:</strong> to provide our services
          </li>
          <li>
            <strong>Consent:</strong> for marketing communications (if
            applicable)
          </li>
          <li>
            <strong>Legitimate interest:</strong> to improve our services and
            ensure security
          </li>
          <li>
            <strong>Legal obligation:</strong> to comply with applicable laws
          </li>
        </ul>
      </section>

      <section>
        <h2>Data sharing</h2>
        <p>We do not sell your personal data. We may share your data with:</p>
        <ul>
          <li>
            <strong>Service providers:</strong> hosting (Vercel), payment
            (Stripe), email (Resend), database (Neon), file storage (Cloudflare
            R2), caching (Upstash)
          </li>
          <li>
            <strong>Authorities:</strong> if required by law or to protect our
            rights
          </li>
        </ul>
        <p>
          These providers are contractually bound to protect your data and to
          use it only for the services they provide us.
        </p>
      </section>

      <section>
        <h2>International transfers</h2>
        <p>
          Some of our providers are located in the United States. Data transfers
          to these countries are governed by appropriate safeguards (European
          Commission standard contractual clauses).
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>We retain your data for the following periods:</p>
        <ul>
          <li>
            <strong>Account data:</strong> for the duration of your account,
            then 3 years after deletion
          </li>
          <li>
            <strong>Billing data:</strong> 10 years (legal obligation)
          </li>
          <li>
            <strong>Log data:</strong> 12 months
          </li>
          <li>
            <strong>Cookies:</strong> see the dedicated section
          </li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>Under the GDPR, you have the following rights over your data:</p>
        <ul>
          <li>
            <strong>Right of access:</strong> obtain a copy of your data
          </li>
          <li>
            <strong>Right to rectification:</strong> correct inaccurate data
          </li>
          <li>
            <strong>Right to erasure:</strong> request deletion of your data
          </li>
          <li>
            <strong>Right to restriction:</strong> restrict the processing of
            your data
          </li>
          <li>
            <strong>Right to portability:</strong> receive your data in a
            structured format
          </li>
          <li>
            <strong>Right to object:</strong> object to the processing of your
            data
          </li>
          <li>
            <strong>Right to withdraw consent:</strong> at any time
          </li>
        </ul>
        <p>To exercise these rights, contact us at: contact@example.com</p>
        <p>
          You also have the right to lodge a complaint with the CNIL (French
          data protection authority).
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Our site uses cookies to function properly and improve your
          experience. For a full breakdown of the cookies used and their
          purposes, see our{" "}
          <Link href="/cookie-policy" className="underline underline-offset-4">
            cookie policy
          </Link>
          .
        </p>
        <p>
          You can manage your cookie preferences at any time via the cookie icon
          at the bottom right of the page or in your browser settings.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We implement appropriate security measures to protect your data
          against unauthorized access, alteration, disclosure, or destruction:
        </p>
        <ul>
          <li>Encryption of data in transit (HTTPS)</li>
          <li>Password encryption</li>
          <li>Restricted access to personal data</li>
          <li>Regular security monitoring and audits</li>
        </ul>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this privacy policy periodically. In the event of a
          material change, we will notify you by email or via a notification on
          our site.
        </p>
        <p>
          We encourage you to review this page regularly to stay informed about
          our data protection practices.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question regarding this privacy policy or the processing of
          your personal data, you can contact us:
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

export { PrivacyPolicyContentEn };
