import Link from "next/link";

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
        <Clock
          className="text-muted-foreground mx-auto mb-6 h-16 w-16"
          aria-hidden="true"
        />

        <h1
          id="too-many-requests-title"
          className="text-foreground mb-2 text-4xl font-bold"
        >
          429
        </h1>

        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Trop de requêtes
        </h2>

        <p className="text-muted-foreground mb-8">
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
