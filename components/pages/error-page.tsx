"use client";

import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="mx-auto max-w-md text-center">
        <AlertTriangle
          className="text-destructive mx-auto mb-6 h-16 w-16"
          aria-hidden="true"
        />

        <h1
          id="error-title"
          className="text-foreground mb-2 text-4xl font-bold"
        >
          Erreur
        </h1>

        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Une erreur est survenue
        </h2>

        <p className="text-muted-foreground mb-8">
          Désolé, une erreur inattendue s'est produite. Veuillez réessayer.
        </p>

        {error.digest && (
          <p className="text-muted-foreground mb-6 text-sm">
            Code d'erreur : {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>

          <Button type="button" variant="outline" asChild>
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { ErrorPage };
