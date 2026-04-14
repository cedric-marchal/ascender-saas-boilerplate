import Link from "next/link";

import { LogIn } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

function UnauthorizedPage() {
  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="unauthorized-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-500/10">
          <LogIn className="size-8 text-blue-500" aria-hidden="true" />
        </div>

        <h1
          id="unauthorized-title"
          className="text-foreground mb-2 text-4xl font-bold tabular-nums"
        >
          401
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          Authentification requise
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          Vous devez être connecté pour accéder à cette page.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" asChild>
            <Link href="/connexion">Se connecter</Link>
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { UnauthorizedPage };
