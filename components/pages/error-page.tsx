"use client";

import { useEffect } from "react";

import type { Route } from "next";
import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <Main
      className="flex flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
        </div>

        <h1
          id="error-title"
          className="text-foreground mb-2 text-4xl font-bold"
        >
          Erreur
        </h1>

        <h2 className="text-foreground mb-3 text-xl font-semibold">
          Une erreur est survenue
        </h2>

        <p className="text-muted-foreground mb-8 text-sm">
          Désolé, une erreur inattendue s'est produite. Veuillez réessayer.
        </p>

        {error.digest && (
          <p className="text-muted-foreground mb-6 font-mono text-xs">
            Code : {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>

          <Button type="button" variant="outline" asChild>
            {/* Plain next/link to the unlocalized root: the error boundary
                may render outside the [locale] segment's
                NextIntlClientProvider, so the i18n Link is avoided here.
                proxy.ts negotiates the correct locale on the next request. */}
            <Link href={"/" as Route}>Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </Main>
  );
}

export { ErrorPage };
