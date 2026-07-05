import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";

import { CopyrightYear } from "@/components/public/copyright-year";
import { Separator } from "@/components/ui/separator";

function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                {env.NEXT_PUBLIC_APP_NAME.charAt(0)}
              </div>
              <span className="text-sm font-semibold tracking-tight">
                {env.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Centralisez vos workflows, automatisez les tâches répétitives et
              livrez plus vite grâce à {env.NEXT_PUBLIC_APP_NAME}.
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">Navigation</h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">Compte</h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/sign-up"
                    className="hover:text-foreground transition-colors"
                  >
                    Inscription
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-in"
                    className="hover:text-foreground transition-colors"
                  >
                    Connexion
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-sm font-semibold">Légal</h3>
              <ul className="text-muted-foreground space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/legal-notice"
                    className="hover:text-foreground transition-colors"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-foreground transition-colors"
                  >
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    className="hover:text-foreground transition-colors"
                  >
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-foreground transition-colors"
                  >
                    Conditions d'utilisation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-sale"
                    className="hover:text-foreground transition-colors"
                  >
                    Conditions de vente
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <p>
            &copy; <CopyrightYear /> {env.NEXT_PUBLIC_APP_NAME}. Tous droits
            réservés.
          </p>
          <div className="flex gap-4">
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/sitemap-page"
              className="hover:text-foreground transition-colors"
            >
              Plan du site
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
