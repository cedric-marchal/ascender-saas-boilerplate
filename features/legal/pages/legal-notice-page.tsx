import { getLegalNoticeSchema } from "@/features/legal/constants/legal-seo.constant";

import { env } from "@/lib/env";

import { Main } from "@/components/main";

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

function LegalNoticePage() {
  const webPageSchema = getLegalNoticeSchema();

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
              Mentions légales
            </h1>
            <p className="text-muted-foreground mt-4 text-sm">
              Dernière mise à jour : 4 février 2026
            </p>
          </header>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section>
              <h2>Éditeur du site</h2>
              <p>
                Le site <strong>{APP_NAME}</strong> est édité par :
              </p>
              <ul>
                <li>
                  <strong>Raison sociale :</strong> [Nom de l'entreprise]
                </li>
                <li>
                  <strong>Forme juridique :</strong> [SAS, SARL,
                  Auto-entrepreneur, etc.]
                </li>
                <li>
                  <strong>Capital social :</strong> [Montant] €
                </li>
                <li>
                  <strong>Siège social :</strong> [Adresse complète]
                </li>
                <li>
                  <strong>SIRET :</strong> [Numéro SIRET]
                </li>
                <li>
                  <strong>RCS :</strong> [Ville] B [Numéro]
                </li>
                <li>
                  <strong>Numéro de TVA :</strong> [Numéro TVA
                  intracommunautaire]
                </li>
                <li>
                  <strong>Email :</strong> contact@example.com
                </li>
                <li>
                  <strong>Directeur de la publication :</strong> [Nom du
                  responsable]
                </li>
              </ul>
            </section>

            <section>
              <h2>Hébergement</h2>
              <p>Le site est hébergé par :</p>
              <ul>
                <li>
                  <strong>Hébergeur :</strong> Vercel Inc.
                </li>
                <li>
                  <strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina,
                  CA 91723, États-Unis
                </li>
                <li>
                  <strong>Site web :</strong>{" "}
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
              <h2>Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus présents sur le site {APP_NAME} (textes,
                images, graphismes, logo, icônes, sons, logiciels, etc.) est
                protégé par les lois françaises et internationales relatives à
                la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication,
                adaptation de tout ou partie des éléments du site, quel que soit
                le moyen ou le procédé utilisé, est interdite, sauf autorisation
                écrite préalable de l'éditeur.
              </p>
              <p>
                Toute exploitation non autorisée du site ou de l'un quelconque
                des éléments qu'il contient sera considérée comme constitutive
                d'une contrefaçon et poursuivie conformément aux dispositions
                des articles L.335-2 et suivants du Code de Propriété
                Intellectuelle.
              </p>
            </section>

            <section>
              <h2>Limitation de responsabilité</h2>
              <p>
                L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des
                informations diffusées sur le site, dont il se réserve le droit
                de corriger le contenu à tout moment et sans préavis.
              </p>
              <p>
                L'éditeur ne peut garantir l'exactitude, la précision ou
                l'exhaustivité des informations mises à disposition sur le site
                et décline toute responsabilité pour toute imprécision,
                inexactitude ou omission portant sur des informations
                disponibles sur le site.
              </p>
              <p>
                L'éditeur ne saurait être tenu responsable des dommages directs
                ou indirects résultant de l'accès ou de l'utilisation du site, y
                compris l'inaccessibilité, les pertes de données,
                détériorations, destructions ou virus qui pourraient affecter
                l'équipement informatique de l'utilisateur.
              </p>
            </section>

            <section>
              <h2>Liens hypertextes</h2>
              <p>
                Le site peut contenir des liens hypertextes vers d'autres sites.
                L'éditeur n'exerce aucun contrôle sur ces sites et décline toute
                responsabilité quant à leur contenu ou aux pratiques de
                confidentialité de leurs exploitants.
              </p>
              <p>
                La création de liens hypertextes vers le site {APP_NAME} est
                soumise à l'accord préalable de l'éditeur. Pour toute demande,
                veuillez nous contacter à l'adresse indiquée ci-dessus.
              </p>
            </section>

            <section>
              <h2>Droit applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit
                français. En cas de litige, les tribunaux français seront seuls
                compétents.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Pour toute question relative aux présentes mentions légales,
                vous pouvez nous contacter à l'adresse suivante :
                contact@example.com
              </p>
            </section>
          </div>
        </article>
      </Main>
    </>
  );
}

export { LegalNoticePage };
