import Link from "next/link";

import { getCookiePolicySchema } from "@/features/legal/constants/legal-seo.constant";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

function CookiePolicyPage() {
  const webPageSchema = getCookiePolicySchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />

      <Main>
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <header className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Politique des cookies
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              Dernière mise à jour : 4 février 2026
            </p>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section>
              <h2>Introduction</h2>
              <p>
                La présente politique vous informe sur les cookies déposés sur
                le site {APP_NAME} lors de votre visite. Elle a été élaborée
                conformément aux recommandations de la CNIL (Commission
                Nationale de l'Informatique et des Libertés) et au Règlement
                Général sur la Protection des Données (RGPD).
              </p>
              <p>
                Un cookie est un petit fichier texte enregistré sur votre
                dispositif lors de votre visite sur notre site. Il permet de
                mémoriser des informations relatives à votre navigation.
              </p>
            </section>

            <section>
              <h2>Cookies nécessaires</h2>
              <p>
                Ces cookies sont indispensables au bon fonctionnement du site.
                Ils ne peuvent pas être désactivés et ne nécessitent pas votre
                consentement préalable, conformément à l'article 82 de la loi
                Informatique et Libertés.
              </p>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="text-left">Nom</th>
                      <th className="text-left">Finalité</th>
                      <th className="text-left">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>better-auth.session-token</code>
                      </td>
                      <td>Authentification de l'utilisateur</td>
                      <td>Durée de la session</td>
                    </tr>
                    <tr>
                      <td>
                        <code>better-auth.session-expiry</code>
                      </td>
                      <td>Expiration de la session</td>
                      <td>Durée de la session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2>Cookies fonctionnels</h2>
              <p>
                Ces cookies permettent de mémoriser vos préférences pour
                améliorer votre expérience. Ils ne sont déposés qu'après
                obtention de votre consentement.
              </p>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th className="text-left">Nom</th>
                      <th className="text-left">Finalité</th>
                      <th className="text-left">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>theme</code>
                      </td>
                      <td>Préférence de thème (clair / sombre)</td>
                      <td>1 an</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2>Cookies analytiques</h2>
              <p>
                Ces cookies nous permettent de mesurer le trafic et d'analyser
                le comportement des visiteurs pour améliorer notre service. Les
                données collectées sont anonymisées. Ils ne sont déposés qu'avec
                votre consentement.
              </p>
              <p>
                <em>
                  Aucun outil d'analyse n'est actuellement configuré. Cette
                  section sera mise à jour dès l'intégration d'un outil.
                </em>
              </p>
            </section>

            <section>
              <h2>Cookies marketing</h2>
              <p>
                Ces cookies permettent de vous proposer des contenus et des
                publicités adaptés à vos centres d'intérêt. Ils ne sont déposés
                qu'avec votre consentement.
              </p>
              <p>
                <em>
                  Aucun partenaire publicitaire n'est actuellement configuré.
                  Cette section sera mise à jour en cas d'intégration.
                </em>
              </p>
            </section>

            <section>
              <h2>Stockage local</h2>
              <p>
                Notre site utilise également le stockage local du navigateur
                (localStorage), qui ne constitue pas un cookie au sens strict
                mais stocke des données de même nature sur votre dispositif :
              </p>
              <ul>
                <li>
                  <strong>next-cookie-consent :</strong> mémorise vos choix de
                  consentement et vos préférences par catégorie de cookies
                </li>
              </ul>
            </section>

            <section>
              <h2>Gestion de vos préférences</h2>
              <p>
                Vous pouvez gérer vos préférences de cookies de plusieurs
                manières :
              </p>
              <ul>
                <li>
                  <strong>Via notre interface :</strong> en cliquant sur l'icône
                  de cookie en bas à droite de la page, vous pouvez modifier vos
                  préférences à tout moment
                </li>
                <li>
                  <strong>Via votre navigateur :</strong> vous pouvez configurer
                  votre navigateur pour bloquer ou supprimer les cookies.
                  Consultez les paramètres de votre navigateur pour plus
                  d'informations
                </li>
              </ul>
              <p>
                La désactivation des cookies nécessaires peut entraîner un
                dysfonctionnement du site et empêcher l'accès à certaines
                fonctionnalités.
              </p>
            </section>

            <section>
              <h2>Modifications</h2>
              <p>
                Nous pouvons mettre à jour cette politique des cookies à tout
                moment. En cas de modification substantielle, nous vous
                informerons via une notification sur notre site.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Pour toute question concernant notre utilisation des cookies,
                vous pouvez nous contacter :
              </p>
              <ul>
                <li>
                  <strong>Email :</strong> contact@example.com
                </li>
                <li>
                  <strong>Formulaire :</strong>{" "}
                  <Link
                    href="/contact"
                    className="underline underline-offset-4"
                  >
                    Page de contact
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </Main>
    </>
  );
}

export { CookiePolicyPage };
