import Link from "next/link";

import { env } from "@/lib/env";

import { Separator } from "@/components/ui/separator";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/80 border-t backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="rounded-md border px-2 py-1 text-xs font-medium tracking-wide uppercase">
                {env.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
            <h2 className="text-lg leading-snug font-semibold md:text-xl">
              Plateforme SaaS d&apos;IA pour gagner du temps au quotidien.
            </h2>
            <p className="text-muted-foreground text-sm">
              Centralisez vos workflows, automatisez les tâches répétitives et
              livrez plus vite grâce à {env.NEXT_PUBLIC_APP_NAME}.
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            <nav className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold tracking-wide">
                Navigation
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/tarifs"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold tracking-wide">
                Compte
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/inscription"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Inscription
                  </Link>
                </li>
                <li>
                  <Link
                    href="/connexion"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Connexion
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold tracking-wide">
                Légal
              </h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link
                    href="/mentions-legales"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/politique-de-confidentialite"
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div />

          <div className="text-muted-foreground flex flex-1 flex-col items-start gap-3 text-xs md:items-end">
            <p>
              &copy; {currentYear} {env.NEXT_PUBLIC_APP_NAME}. Tous droits
              réservés.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Contact
              </Link>
              <Link
                href="/plan-du-site"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Plan du site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
