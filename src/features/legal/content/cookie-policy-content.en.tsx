import { Link } from "@/i18n/navigation";

type CookiePolicyContentEnProps = {
  appName: string;
};

/**
 * English translation of `cookie-policy-content.fr.tsx`.
 */
function CookiePolicyContentEn({ appName }: CookiePolicyContentEnProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <section>
        <h2>Introduction</h2>
        <p>
          This policy informs you about the cookies placed on the {appName} site
          during your visit. It was drafted in accordance with the
          recommendations of the CNIL (French data protection authority) and the
          General Data Protection Regulation (GDPR).
        </p>
        <p>
          A cookie is a small text file saved on your device when you visit our
          site. It stores information related to your browsing.
        </p>
      </section>

      <section>
        <h2>Essential cookies</h2>
        <p>
          These cookies are essential for the site to function properly. They
          cannot be disabled and do not require your prior consent, in
          accordance with applicable French data protection law.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Purpose</th>
                <th className="text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>better-auth.session-token</code>
                </td>
                <td>User authentication</td>
                <td>Session duration</td>
              </tr>
              <tr>
                <td>
                  <code>better-auth.session-expiry</code>
                </td>
                <td>Session expiration</td>
                <td>Session duration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Functional cookies</h2>
        <p>
          These cookies remember your preferences to improve your experience.
          They are only placed after obtaining your consent.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Purpose</th>
                <th className="text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>theme</code>
                </td>
                <td>Theme preference (light / dark)</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Analytics cookies</h2>
        <p>
          These cookies allow us to measure traffic and analyze visitor behavior
          to improve our service. The data collected is anonymized. They are
          only placed with your consent.
        </p>
        <p>
          <em>
            No analytics tool is currently configured. This section will be
            updated once a tool is integrated.
          </em>
        </p>
      </section>

      <section>
        <h2>Marketing cookies</h2>
        <p>
          These cookies allow us to offer you content and ads tailored to your
          interests. They are only placed with your consent.
        </p>
        <p>
          <em>
            No advertising partner is currently configured. This section will be
            updated if one is integrated.
          </em>
        </p>
      </section>

      <section>
        <h2>Local storage</h2>
        <p>
          Our site also uses the browser's local storage (localStorage), which
          is not strictly a cookie but stores data of a similar nature on your
          device:
        </p>
        <ul>
          <li>
            <strong>next-cookie-consent:</strong> remembers your consent choices
            and your preferences per cookie category
          </li>
        </ul>
      </section>

      <section>
        <h2>Managing your preferences</h2>
        <p>You can manage your cookie preferences in several ways:</p>
        <ul>
          <li>
            <strong>Via our interface:</strong> by clicking the cookie icon at
            the bottom right of the page, you can change your preferences at any
            time
          </li>
          <li>
            <strong>Via your browser:</strong> you can configure your browser to
            block or delete cookies. See your browser's settings for more
            information
          </li>
        </ul>
        <p>
          Disabling essential cookies may cause the site to malfunction and
          prevent access to certain features.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this cookie policy at any time. In the event of a
          material change, we will notify you via a notification on our site.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question regarding our use of cookies, you can contact us:
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

export { CookiePolicyContentEn };
