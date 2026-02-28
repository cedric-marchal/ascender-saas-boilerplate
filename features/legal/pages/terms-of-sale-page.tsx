import Link from "next/link";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

import {
  TERMS_OF_SALE_DESCRIPTION,
  getTermsOfSaleSchema,
} from "@/features/legal/constants/legal-seo.constant";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

function TermsOfSalePage() {
  const webPageSchema = getTermsOfSaleSchema();

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
              Conditions de vente
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              Dernière mise à jour : 4 février 2026
            </p>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section>
              <h2>Champ d'application</h2>
              <p>
                Les présentes conditions de vente (« CGV ») régissent toute
                transaction commerciale effectuée sur le site {APP_NAME}
                (« le site »), exploité par [Nom de l'entreprise] (« le
                fournisseur »).
              </p>
              <p>
                Ces CGV doivent être lues en complément des{" "}
                <Link
                  href="/conditions-d-utilisation"
                  className="underline underline-offset-4"
                >
                  conditions d'utilisation
                </Link>
                . En cas de conflit entre les deux documents, les présentes CGV
                prévalent sur les questions commerciales.
              </p>
            </section>

            <section>
              <h2>Description des offres</h2>
              <p>
                Le service {APP_NAME} est proposé sous la forme d'abonnements à
                durée indéterminée. Les offres disponibles et leurs
                fonctionnalités sont décrites sur notre{" "}
                <Link href="/tarifs" className="underline underline-offset-4">
                  page de tarifs
                </Link>
                .
              </p>
              <p>
                Le fournisseur se réserve le droit de modifier l'ensemble des
                offres à tout moment. Les modifications n'affectent pas les
                abonnements en cours jusqu'à leur date de renouvellement.
              </p>
            </section>

            <section>
              <h2>Prix et facturation</h2>
              <p>
                Les prix sont affichés en euros, toutes taxes comprises (TTC).
                La facturation est effectuée selon la périodicité choisie lors
                de la souscription (mensuelle ou annuelle).
              </p>
              <p>
                Une facture est émise automatiquement à chaque renouvellement de
                l'abonnement. Les factures sont disponibles dans la section «
                Facturation » de votre compte.
              </p>
            </section>

            <section>
              <h2>Modes de paiement</h2>
              <p>
                Les paiements sont traités par notre prestataire de paiement
                Stripe. Les modes de paiement acceptés sont :
              </p>
              <ul>
                <li>carte bancaire (Visa, Mastercard, American Express)</li>
              </ul>
              <p>
                Vous êtes responsable de vous assurer que votre mode de paiement
                reste valide. En cas d'échec de paiement, vous serez informé et
                votre accès au service pourrait être suspendu jusqu'à
                régularisation.
              </p>
            </section>

            <section>
              <h2>Renouvellement et durée</h2>
              <p>
                L'abonnement se renouvelle automatiquement à la fin de chaque
                période de facturation, sauf si vous le résiliez au préalable.
                Un email de rappel de renouvellement est envoyé 7 jours avant la
                date de facturation.
              </p>
              <p>
                En cas de changement de prix, vous serez informé au moins 30
                jours avant l'entrée en vigueur du nouveau prix. Vous pouvez
                résiler votre abonnement avant cette date si vous n'acceptez pas
                la nouvelle tarification.
              </p>
            </section>

            <section>
              <h2>Résiliation</h2>
              <p>
                Vous pouvez résiler votre abonnement à tout moment depuis les
                paramètres de votre compte ou via le portail client Stripe. La
                résiliation prend effet à la fin de la période de facturation en
                cours. Vous conserverez un accès complet au service jusqu'à
                cette date.
              </p>
              <p>
                Le fournisseur peut également résiler l'abonnement en cas de
                violation grave des{" "}
                <Link
                  href="/conditions-d-utilisation"
                  className="underline underline-offset-4"
                >
                  conditions d'utilisation
                </Link>
                .
              </p>
            </section>

            <section>
              <h2>Remboursement</h2>
              <p>
                De manière générale, les paiements effectués pour un abonnement
                ne sont pas remboursables. Les exceptions suivantes s'appliquent
                :
              </p>
              <ul>
                <li>
                  une erreur de facturation de notre part constatée dans les 30
                  jours suivant la transaction
                </li>
                <li>
                  un incident technique grave de notre côté rendant le service
                  indisponible pendant une période significative
                </li>
              </ul>
              <p>
                Pour toute demande de remboursement, veuillez nous contacter
                dans les 30 jours suivant la transaction concernée.
              </p>
            </section>

            <section>
              <h2>Taxes et TVA</h2>
              <p>
                Les prix affichés sont inclusifs de la TVA applicable selon
                votre pays de résidence, conformément à la réglementation
                européenne. Pour les clients basés hors de l'Union européenne,
                la TVA n'est pas applicable.
              </p>
            </section>

            <section>
              <h2>Droit de rétractation</h2>
              <p>
                Conformément à la réglementation européenne sur la vente à
                distance, vous disposez d'un délai de 14 jours calendaires à
                compter de la date de souscription pour exercer votre droit de
                rétractation sur un nouvel abonnement. Ce délai ne s'applique
                pas aux renouvellement automatiques.
              </p>
              <p>
                Pour exercer ce droit, contactez-nous avant l'expiration du
                délai. Le remboursement sera effectué dans les 30 jours suivant
                la réception de votre demande.
              </p>
            </section>

            <section>
              <h2>Limitation de responsabilité</h2>
              <p>
                Notre responsabilité est limitée conformément aux dispositions
                des{" "}
                <Link
                  href="/conditions-d-utilisation"
                  className="underline underline-offset-4"
                >
                  conditions d'utilisation
                </Link>
                . En aucun cas, nous ne pourrons être tenus responsables des
                préjudices indirects liés à une transaction effectuée via le
                site.
              </p>
            </section>

            <section>
              <h2>Droit applicable</h2>
              <p>
                Les présentes CGV sont régies par le droit français. En cas de
                litige relatif à une transaction, la compétence est attribuée
                aux tribunaux de [Ville du siège social].
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Pour toute question relative à ces conditions de vente ou à une
                transaction, vous pouvez nous contacter :
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

export { TermsOfSalePage };
