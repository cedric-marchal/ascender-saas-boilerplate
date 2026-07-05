import { Link } from "@/i18n/navigation";
import { Clock } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

function TooManyRequestsPage() {
  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="too-many-requests-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-orange-100">
          <Clock className="size-8 text-orange-600" aria-hidden="true" />
        </div>

        <h1
          id="too-many-requests-title"
          className="text-foreground mb-2 text-4xl font-bold tabular-nums"
        >
          429
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          Trop de requêtes
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          Vous avez effectué trop de requêtes en peu de temps. Veuillez
          patienter quelques instants avant de réessayer.
        </p>

        <Button type="button" asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </Main>
  );
}

export { TooManyRequestsPage };
