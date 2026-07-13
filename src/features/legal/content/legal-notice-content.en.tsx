type LegalNoticeContentEnProps = {
  appName: string;
};

/**
 * English translation of `legal-notice-content.fr.tsx` — see that file's
 * comment for why legal body copy is componentized per locale instead of
 * living in the message catalog.
 */
function LegalNoticeContentEn({ appName }: LegalNoticeContentEnProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <section>
        <h2>Publisher</h2>
        <p>
          The <strong>{appName}</strong> site is published by:
        </p>
        <ul>
          <li>
            <strong>Company name:</strong> [Company name]
          </li>
          <li>
            <strong>Legal form:</strong> [SAS, SARL, sole proprietorship, etc.]
          </li>
          <li>
            <strong>Share capital:</strong> [Amount] €
          </li>
          <li>
            <strong>Registered office:</strong> [Full address]
          </li>
          <li>
            <strong>Registration number:</strong> [SIRET number]
          </li>
          <li>
            <strong>Trade register:</strong> [City] B [Number]
          </li>
          <li>
            <strong>VAT number:</strong> [Intra-community VAT number]
          </li>
          <li>
            <strong>Email:</strong> contact@example.com
          </li>
          <li>
            <strong>Publication director:</strong> [Name of the person in
            charge]
          </li>
        </ul>
      </section>

      <section>
        <h2>Hosting</h2>
        <p>The site is hosted by:</p>
        <ul>
          <li>
            <strong>Host:</strong> Vercel Inc.
          </li>
          <li>
            <strong>Address:</strong> 440 N Barranca Ave #4133, Covina, CA
            91723, United States
          </li>
          <li>
            <strong>Website:</strong>{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          All content on the {appName} site (text, images, graphics, logo,
          icons, sounds, software, etc.) is protected by French and
          international intellectual property laws.
        </p>
        <p>
          Any reproduction, representation, modification, publication, or
          adaptation of all or part of the site's elements, by any means or
          process whatsoever, is prohibited without the publisher's prior
          written authorization.
        </p>
        <p>
          Any unauthorized use of the site or any of its elements will be
          considered an infringement and prosecuted in accordance with the
          applicable intellectual property laws.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          The publisher strives to ensure the accuracy and updating of the
          information published on the site, and reserves the right to correct
          its content at any time without notice.
        </p>
        <p>
          The publisher cannot guarantee the accuracy, precision, or
          completeness of the information made available on the site and
          disclaims all liability for any inaccuracy, error, or omission
          regarding information available on the site.
        </p>
        <p>
          The publisher cannot be held liable for direct or indirect damages
          resulting from access to or use of the site, including
          inaccessibility, data loss, deterioration, destruction, or viruses
          that could affect the user's computer equipment.
        </p>
      </section>

      <section>
        <h2>Hyperlinks</h2>
        <p>
          The site may contain hyperlinks to other sites. The publisher has no
          control over these sites and disclaims all liability regarding their
          content or the privacy practices of their operators.
        </p>
        <p>
          Creating hyperlinks to the {appName} site is subject to the
          publisher's prior approval. For any request, please contact us at the
          address indicated above.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          This legal notice is governed by French law. In the event of a
          dispute, the French courts shall have sole jurisdiction.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question regarding this legal notice, you can contact us at:
          contact@example.com
        </p>
      </section>
    </div>
  );
}

export { LegalNoticeContentEn };
