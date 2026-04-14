import { Construction } from "lucide-react";

import { Main } from "@/components/main";

function MaintenancePage() {
  return (
    <Main className="flex items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-orange-100">
          <Construction className="size-8 text-orange-600" aria-hidden="true" />
        </div>

        <h1 className="text-foreground mb-3 text-2xl font-semibold">
          Site en maintenance
        </h1>

        <p className="text-muted-foreground text-sm">
          Nous effectuons actuellement une maintenance pour améliorer votre
          expérience. Merci de revenir dans quelques instants.
        </p>
      </div>
    </Main>
  );
}

export { MaintenancePage };
