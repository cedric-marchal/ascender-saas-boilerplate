import { env } from "@/lib/env";

import Link from "next/link";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
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
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-foreground"
                >
                  <Link href="/tarifs">Tarifs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-foreground"
                >
                  <Link href="/contact">Contact</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/connexion">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/inscription">Créer un compte</Link>
          </Button>
        </div>

        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full flex-col border-l bg-background/95 px-6 py-6 sm:max-w-xs"
            >
              <SheetHeader className="px-0 text-left">
                <SheetTitle className="text-base font-semibold">
                  Menu de navigation
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-4 flex-1 space-y-6 overflow-y-auto px-0">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Navigation
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/"
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>Accueil</span>
                        </Link>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/tarifs"
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>Tarifs</span>
                        </Link>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/contact"
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>Contact</span>
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Compte
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/connexion"
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>Connexion</span>
                        </Link>
                      </SheetClose>
                    </li>
                    <li>
                      <SheetClose asChild>
                        <Link
                          href="/inscription"
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                        >
                          <span>Inscription</span>
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </div>
              </nav>

              <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
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
