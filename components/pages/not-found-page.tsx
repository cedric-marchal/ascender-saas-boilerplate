import Link from "next/link";

import { FileQuestion } from "lucide-react";

import { Main } from "@/components/main";
import { Button } from "@/components/ui/button";

function NotFoundPage() {
  return (
    <Main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      role="main"
      aria-labelledby="not-found-title"
    >
      <div className="mx-auto max-w-md text-center">
        <FileQuestion
          className="text-muted-foreground mx-auto mb-6 h-16 w-16"
          aria-hidden="true"
        />

        <h1
          id="not-found-title"
          className="text-foreground mb-2 text-4xl font-bold"
        >
          404
        </h1>

        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Page introuvable
        </h2>

        <p className="text-muted-foreground mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
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

export { NotFoundPage };
