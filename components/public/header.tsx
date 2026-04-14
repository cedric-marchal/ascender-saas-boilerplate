import Link from "next/link";

import { Menu } from "lucide-react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

import { NavLink } from "@/components/public/nav-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MOBILE_LINK_CLASS = "py-1.5 text-[13px]";

async function Header() {
  const session = await getSession();

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
            {env.NEXT_PUBLIC_APP_NAME.charAt(0)}
          </div>
          <span className="text-sm font-semibold tracking-tight">
            {env.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/tarifs">Tarifs</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full flex-col px-6 py-6 sm:max-w-xs"
            >
              <SheetHeader className="px-0 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-xs font-bold">
                    {env.NEXT_PUBLIC_APP_NAME.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold">
                    {env.NEXT_PUBLIC_APP_NAME}
                  </span>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Menu de navigation du site
                </SheetDescription>
              </SheetHeader>

              <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-0">
                <div className="space-y-1">
                  <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
                    Navigation
                  </p>
                  <ul className="space-y-0.5">
                    <li>
                      <SheetClose asChild>
                        <NavLink href="/" className={MOBILE_LINK_CLASS}>
                          Accueil
                        </NavLink>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <NavLink href="/tarifs" className={MOBILE_LINK_CLASS}>
                          Tarifs
                        </NavLink>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <NavLink href="/contact" className={MOBILE_LINK_CLASS}>
                          Contact
                        </NavLink>
                      </SheetClose>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
                    Compte
                  </p>
                  {session ? (
                    <div className="space-y-2 px-3">
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <SignOutButton />
                    </div>
                  ) : (
                    <ul className="space-y-0.5">
                      <li>
                        <SheetClose asChild>
                          <NavLink
                            href="/connexion"
                            className={MOBILE_LINK_CLASS}
                          >
                            Connexion
                          </NavLink>
                        </SheetClose>
                      </li>
                      <li>
                        <SheetClose asChild>
                          <NavLink
                            href="/inscription"
                            className={MOBILE_LINK_CLASS}
                          >
                            Inscription
                          </NavLink>
                        </SheetClose>
                      </li>
                    </ul>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export { Header };
