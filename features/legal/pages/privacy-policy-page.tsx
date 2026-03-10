import Link from "next/link";

import { getPrivacyPolicySchema } from "@/features/legal/constants/legal-seo.constant";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

function PrivacyPolicyPage() {
  const webPageSchema = getPrivacyPolicySchema();

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
              Politique de confidentialité
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              Dernière mise à jour : 4 février 2026
            </p>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section>
              <h2>Introduction</h2>
              <p>
                La présente politique de confidentialité décrit comment{" "}
                {APP_NAME}
                (« nous », « notre », « nos ») collecte, utilise et partage vos
                informations personnelles lorsque vous utilisez notre site web
                et nos services.
              </p>
              <p>
                Nous nous engageons à protéger votre vie privée et à traiter vos
                données personnelles conformément au Règlement Général sur la
                Protection des Données (RGPD) et à la loi Informatique et
                Libertés.
              </p>
            </section>

            <section>
              <h2>Responsable du traitement</h2>
              <p>Le responsable du traitement des données est :</p>
              <ul>
                <li>
                  <strong>Raison sociale :</strong> [Nom de l'entreprise]
                </li>
                <li>
                  <strong>Adresse :</strong> [Adresse complète]
                </li>
                <li>
                  <strong>Email :</strong> contact@example.com
                </li>
              </ul>
            </section>

            <section>
              <h2>Données collectées</h2>
              <p>Nous collectons les types de données suivants :</p>

              <h3>Données que vous nous fournissez</h3>
              <ul>
                <li>
                  <strong>Informations de compte :</strong> nom, adresse email,
                  mot de passe lors de votre inscription
                </li>
                <li>
                  <strong>Informations de profil :</strong> photo de profil,
                  préférences (optionnel)
                </li>
                <li>
                  <strong>Communications :</strong> messages envoyés via le
                  formulaire de contact
                </li>
                <li>
                  <strong>Informations de paiement :</strong> traitées de
                  manière sécurisée par notre prestataire Stripe
                </li>
              </ul>

              <h3>Données collectées automatiquement</h3>
              <ul>
                <li>
                  <strong>Données de connexion :</strong> adresse IP, type de
                  navigateur, système d'exploitation
                </li>
                <li>
                  <strong>Données d'utilisation :</strong> pages visitées, durée
                  de visite, actions effectuées
                </li>
                <li>
                  <strong>Cookies :</strong> voir la section dédiée ci-dessous
                </li>
              </ul>
            </section>

            <section>
              <h2>Finalités du traitement</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul>
                <li>Fournir, maintenir et améliorer nos services</li>
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Traiter vos paiements et gérer votre abonnement</li>
                <li>Répondre à vos demandes et vous fournir une assistance</li>
                <li>Vous envoyer des communications relatives au service</li>
                <li>Assurer la sécurité de notre plateforme</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2>Base légale du traitement</h2>
              <p>Nous traitons vos données sur les bases légales suivantes :</p>
              <ul>
                <li>
                  <strong>Exécution du contrat :</strong> pour fournir nos
                  services
                </li>
                <li>
                  <strong>Consentement :</strong> pour les communications
                  marketing (si applicable)
                </li>
                <li>
                  <strong>Intérêt légitime :</strong> pour améliorer nos
                  services et assurer la sécurité
                </li>
                <li>
                  <strong>Obligation légale :</strong> pour respecter les lois
                  applicables
                </li>
              </ul>
            </section>

            <section>
              <h2>Partage des données</h2>
              <p>
                Nous ne vendons pas vos données personnelles. Nous pouvons
                partager vos données avec :
              </p>
              <ul>
                <li>
                  <strong>Prestataires de services :</strong> hébergement
                  (Vercel), paiement (Stripe), emails (Resend), base de données
                  (Neon), stockage de fichiers (Cloudflare R2), mise en cache
                  (Upstash)
                </li>
                <li>
                  <strong>Autorités :</strong> si requis par la loi ou pour
                  protéger nos droits
                </li>
              </ul>
              <p>
                Ces prestataires sont contractuellement tenus de protéger vos
                données et de ne les utiliser que pour les services qu'ils nous
                fournissent.
              </p>
            </section>

            <section>
              <h2>Transferts internationaux</h2>
              <p>
                Certains de nos prestataires sont situés aux États-Unis. Les
                transferts de données vers ces pays sont encadrés par des
                garanties appropriées (clauses contractuelles types de la
                Commission européenne).
              </p>
            </section>

            <section>
              <h2>Conservation des données</h2>
              <p>Nous conservons vos données pendant les durées suivantes :</p>
              <ul>
                <li>
                  <strong>Données de compte :</strong> pendant la durée de votre
                  compte, puis 3 ans après sa suppression
                </li>
                <li>
                  <strong>Données de facturation :</strong> 10 ans (obligation
                  légale)
                </li>
                <li>
                  <strong>Données de connexion :</strong> 12 mois
                </li>
                <li>
                  <strong>Cookies :</strong> voir la section dédiée
                </li>
              </ul>
            </section>

            <section>
              <h2>Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez des droits suivants sur vos
                données :
              </p>
              <ul>
                <li>
                  <strong>Droit d'accès :</strong> obtenir une copie de vos
                  données
                </li>
                <li>
                  <strong>Droit de rectification :</strong> corriger vos données
                  inexactes
                </li>
                <li>
                  <strong>Droit à l'effacement :</strong> demander la
                  suppression de vos données
                </li>
                <li>
                  <strong>Droit à la limitation :</strong> restreindre le
                  traitement de vos données
                </li>
                <li>
                  <strong>Droit à la portabilité :</strong> recevoir vos données
                  dans un format structuré
                </li>
                <li>
                  <strong>Droit d'opposition :</strong> vous opposer au
                  traitement de vos données
                </li>
                <li>
                  <strong>Droit de retirer votre consentement :</strong> à tout
                  moment
                </li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : contact@example.com
              </p>
              <p>
                Vous avez également le droit d'introduire une réclamation auprès
                de la CNIL (Commission Nationale de l'Informatique et des
                Libertés).
              </p>
            </section>

            <section>
              <h2>Cookies</h2>
              <p>
                Notre site utilise des cookies pour fonctionner correctement et
                améliorer votre expérience. Pour un détail complet des cookies
                utilisés et de leurs finalités, consultez notre{" "}
                <Link
                  href="/politique-des-cookies"
                  className="underline underline-offset-4"
                >
                  politique des cookies
                </Link>
                .
              </p>
              <p>
                Vous pouvez gérer vos préférences de cookies à tout moment via
                l'icône de cookie en bas à droite de la page ou dans les
                paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2>Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité appropriées pour
                protéger vos données contre tout accès non autorisé,
                modification, divulgation ou destruction :
              </p>
              <ul>
                <li>Chiffrement des données en transit (HTTPS)</li>
                <li>Chiffrement des mots de passe</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance et audits de sécurité réguliers</li>
              </ul>
            </section>

            <section>
              <h2>Modifications</h2>
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité
                périodiquement. En cas de modification substantielle, nous vous
                informerons par email ou via une notification sur notre site.
              </p>
              <p>
                Nous vous encourageons à consulter régulièrement cette page pour
                rester informé de nos pratiques en matière de protection des
                données.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Pour toute question concernant cette politique de
                confidentialité ou le traitement de vos données personnelles,
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

export { PrivacyPolicyPage };
