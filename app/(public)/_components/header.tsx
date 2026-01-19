import Link from "next/link";

import { Menu } from "lucide-react";

import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

async function Header() {
  const session = await getSession();

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="rounded-md border px-2 py-1 text-xs font-medium tracking-wide uppercase">
            {env.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>

        <nav className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
                >
                  <Link href="/tarifs">Tarifs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
                >
                  <Link href="/contact">Contact</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Ouvrir le menu">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background/95 flex h-full flex-col border-l px-6 py-6 sm:max-w-xs"
            >
              <SheetHeader className="px-0 text-left">
                <SheetTitle className="text-base font-semibold">
                  Menu de navigation
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-0">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.15em] uppercase">
                    Navigation
                  </p>
                  <ul className="text-muted-foreground space-y-1.5 text-sm">
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/"
                          className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2"
                        >
                          <span>Accueil</span>
                        </Link>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/tarifs"
                          className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2"
                        >
                          <span>Tarifs</span>
                        </Link>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/contact"
                          className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2"
                        >
                          <span>Contact</span>
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.15em] uppercase">
                    Compte
                  </p>
                  {session ? (
                    <>
                      <Button asChild variant="ghost">
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <SignOutButton />
                    </>
                  ) : (
                    <ul className="text-muted-foreground space-y-1.5 text-sm">
                      <li>
                        <SheetClose asChild>
                          <Link
                            href="/connexion"
                            className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2"
                          >
                            <span>Connexion</span>
                          </Link>
                        </SheetClose>
                      </li>
                      <li>
                        <SheetClose asChild>
                          <Link
                            href="/inscription"
                            className="hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md px-3 py-2"
                          >
                            <span>Inscription</span>
                          </Link>
                        </SheetClose>
                      </li>
                    </ul>
                  )}
                </div>
              </nav>

              <div className="text-muted-foreground mt-4 border-t pt-4 text-xs">
                <p>
                  Accédez rapidement aux principales pages du site ou créez un
                  compte pour commencer à utiliser {env.NEXT_PUBLIC_APP_NAME}.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Separator />
    </header>
  );
}

export { Header };
