import Link from "next/link";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

import {
  TERMS_OF_SERVICE_DESCRIPTION,
  getTermsOfServiceSchema,
} from "@/features/legal/constants/legal-seo.constant";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

function TermsOfServicePage() {
  const webPageSchema = getTermsOfServiceSchema();

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
              Conditions d'utilisation
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              Dernière mise à jour : 4 février 2026
            </p>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section>
              <h2>Champ d'application</h2>
              <p>
                Les présentes conditions d'utilisation (« CGU ») régissent
                l'accès et l'utilisation du service {APP_NAME} (« le service »)
                mis à disposition par [Nom de l'entreprise] (« nous », « le
                fournisseur »).
              </p>
              <p>
                En accédant au service, vous (« l'utilisateur ») acceptez ces
                CGU dans leur intégralité. Si vous ne adhérez pas à ces
                conditions, vous devez cesser d'utiliser le service.
              </p>
            </section>

            <section>
              <h2>Création de compte</h2>
              <p>
                L'accès au service nécessite la création d'un compte
                utilisateur. Pour créer un compte, vous devez :
              </p>
              <ul>
                <li>être majeur, c'est-à-dire avoir atteint l'âge de 18 ans</li>
                <li>
                  fournir des informations exactes, complètes et à jour (nom,
                  adresse email valide)
                </li>
                <li>disposer d'une seule adresse email par compte</li>
              </ul>
              <p>
                Vous êtes responsable de la confidentialité de vos identifiants
                de connexion et de toute action effectuée via votre compte. Vous
                devez nous informer immédiatement de tout accès non autorisé à
                votre compte.
              </p>
            </section>

            <section>
              <h2>Obligations de l'utilisateur</h2>
              <p>En utilisant le service, vous vous engagez à :</p>
              <ul>
                <li>respecter les lois et réglementations applicables</li>
                <li>
                  ne pas altérer, compromettre ou interrompre le fonctionnement
                  du service
                </li>
                <li>
                  ne pas tenter d'accéder à des données ou des systèmes pour
                  lesquels vous n'avez pas autorisation
                </li>
                <li>
                  ne pas vous faire passer pour une autre personne ou entité
                </li>
                <li>
                  ne pas utiliser le service à des fins illégales ou
                  préjudiciables
                </li>
              </ul>
            </section>

            <section>
              <h2>Utilisations interdites</h2>
              <p>Il est interdit d'utiliser le service pour :</p>
              <ul>
                <li>
                  toute activité illégale, y compris la fraude, le blanchiment
                  d'argent ou le financement du terrorisme
                </li>
                <li>
                  le harcèlement, les menaces, l'intimidation ou tout
                  comportement discriminatoire
                </li>
                <li>
                  l'envoi de communications non sollicitées (spam) ou la
                  diffusion de contenus malveillants
                </li>
                <li>
                  l'atteinte aux droits de propriété intellectuelle de tiers
                </li>
                <li>
                  la collecte ou l'extraction de données du service par des
                  moyens automatisés non autorisés
                </li>
                <li>
                  toute action susceptible de compromettre la sécurité ou
                  l'intégrité du service
                </li>
              </ul>
            </section>

            <section>
              <h2>Contenus et données utilisateur</h2>
              <p>
                Vous êtes seul responsable des contenus que vous créez, publiez
                ou transmettez via le service. Vous représentez que vous
                possédez tous les droits nécessaires sur ces contenus et que
                leur utilisation ne contrevient à aucune loi ou réglementation.
              </p>
              <p>
                En soumettant des contenus au service, vous nous accordez une
                licence non exclusive, mondiale, gratuite, pour la durée de
                votre utilisation du service, permettant de traiter ces contenus
                uniquement aux fins de la fourniture du service.
              </p>
            </section>

            <section>
              <h2>Propriété intellectuelle</h2>
              <p>
                Le service, y compris son interface, ses logos, ses contenus
                originaux et ses fonctionnalités, est protégé par les droits de
                propriété intellectuelle. Vous ne pouvez pas copier, modifier,
                reproduire, ingénier en code inverse, décompiler ou créer des
                œuvres dérivées à partir du service.
              </p>
              <p>
                Nous vous accordons une licence personnelle, non exclusive, non
                transférable et revocable pour utiliser le service conformément
                aux présentes CGU.
              </p>
            </section>

            <section>
              <h2>Limitation de responsabilité</h2>
              <p>
                Le service est fourni « tel quel », sans garantie d'aucune
                sorte, qu'elle soit express ou implicite. Nous n'offrons aucune
                garantie concernant la qualité, l'adéquation à un usage
                particulier, la fiabilité ou la performance du service.
              </p>
              <p>
                Dans la mesure autorisée par la loi applicable, nous ne sommes
                pas responsables des dommages indirects, spéciaux ou consécutifs
                résultant de votre utilisation du service, y compris les pertes
                de données, les pertes de profits ou les interruptions
                d'activité.
              </p>
              <p>
                Notre responsabilité totale envers vous ne pourra excéder le
                montant total que vous avez payé pour le service au cours des
                douze mois précédant l'événement à l'origine du préjudice.
              </p>
            </section>

            <section>
              <h2>Suspension et résiliation</h2>
              <p>
                Nous pouvons suspendre ou résilier votre compte, à notre
                discrétion, en cas de violation grave des présentes CGU,
                préjudice causé à d'autres utilisateurs ou au service, ou
                activité illégale.
              </p>
              <p>
                Vous pouvez résiler votre compte à tout moment via les
                paramètres de votre compte ou en nous contactant. En cas de
                résiliation, votre accès au service sera révoqué et vos données
                traitées conformément à notre{" "}
                <Link
                  href="/politique-de-confidentialite"
                  className="underline underline-offset-4"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </section>

            <section>
              <h2>Modification des CGU</h2>
              <p>
                Nous nous réservons le droit de modifier ces CGU à tout moment.
                En cas de modification substantielle, nous vous informerons par
                email ou via une notification sur le service au moins 30 jours
                avant l'entrée en vigueur des nouvelles conditions.
              </p>
              <p>
                Votre utilisation continue du service après la modification
                implique votre acceptation des nouvelles CGU. Si vous n'acceptez
                pas les modifications, vous devez cesser d'utiliser le service
                avant la date d'entrée en vigueur.
              </p>
            </section>

            <section>
              <h2>Droit applicable et juridiction compétente</h2>
              <p>
                Les présentes CGU sont régies par le droit français. En cas de
                litige, vous et nous convenons de soumettre la compétence aux
                tribunaux de [Ville du siège social], à l'exclusion de toute
                convention contraire.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Pour toute question relative aux présentes conditions
                d'utilisation, vous pouvez nous contacter :
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

export { TermsOfServicePage };
