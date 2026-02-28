import { Mail, MapPin } from "lucide-react";

import { ContactForm } from "@/features/contact/components/forms/contact-form";
import { getContactSchema } from "@/features/contact/constants/contact-seo.constant";

import { Main } from "@/components/main";

function ContactPage() {
  const contactPageSchema = getContactSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageSchema),
        }}
      />

      <Main className="bg-background">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:px-8 lg:py-20">
          <header className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Une question, un projet ou un besoin spécifique ? Remplissez le
              formulaire ci-dessous et nous vous répondons sous 24h.
            </p>
          </header>

          <div className="grid gap-10 md:grid-cols-5">
            <div className="space-y-6 md:col-span-2">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Informations</h2>
                <div className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-foreground font-medium">Email</p>
                      <a
                        href="mailto:contact@example.com"
                        className="hover:text-foreground"
                      >
                        contact@example.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-foreground font-medium">Adresse</p>
                      <p>Paris, France</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">Horaires</h2>
                <p className="text-muted-foreground text-sm">
                  Du lundi au vendredi, de 9h à 18h (heure de Paris).
                </p>
              </div>
            </div>

            <div className="md:col-span-3">
              <ContactForm />
            </div>
          </div>
        </section>
      </Main>
    </>
  );
}

export { ContactPage };
