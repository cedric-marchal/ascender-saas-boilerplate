import { Mail, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ContactForm } from "@/features/contact/components/forms/contact-form";
import { getContactSchema } from "@/features/contact/constants/contact-seo.constant";

import { Main } from "@/components/main";

async function ContactPage() {
  const locale = await getLocale();
  const t = await getTranslations("contact");
  const tCommon = await getTranslations("common");

  const description = t("seo.description", { appName: tCommon("appName") });
  const contactPageSchema = getContactSchema(locale, description);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageSchema),
        }}
      />

      <Main>
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:px-8 lg:py-20">
          <header className="space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("heading")}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              {t("subheading")}
            </p>
          </header>

          <div className="grid gap-10 md:grid-cols-5">
            <div className="space-y-6 md:col-span-2">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">{t("infoTitle")}</h2>
                <div className="text-muted-foreground space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-foreground font-medium">
                        {t("emailLabel")}
                      </p>
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
                      <p className="text-foreground font-medium">
                        {t("addressLabel")}
                      </p>
                      <p>{t("addressValue")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-medium">{t("hoursTitle")}</h2>
                <p className="text-muted-foreground text-sm">
                  {t("hoursDescription")}
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
