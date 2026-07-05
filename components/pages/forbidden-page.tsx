import { Link } from "@/i18n/navigation";
import { ShieldX } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

function ForbiddenPage() {
  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="forbidden-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="size-8 text-red-600" aria-hidden="true" />
        </div>

        <h1
          id="forbidden-title"
          className="text-foreground mb-2 text-4xl font-bold tabular-nums"
        >
          403
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          Accès interdit
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          Vous n'avez pas les permissions nécessaires pour accéder à cette
          ressource.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href="/contact">Contactez-nous</Link>
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { ForbiddenPage };
