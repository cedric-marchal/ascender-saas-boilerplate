import { Construction } from "lucide-react";

import { Main } from "@/components/main";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function MaintenancePage() {
  return (
    <Main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Construction
              className="text-muted-foreground h-8 w-8"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-2xl">Site en maintenance</CardTitle>
          <CardDescription className="text-base">
            Nous effectuons actuellement une maintenance pour améliorer votre
            expérience. Merci de revenir dans quelques instants.
          </CardDescription>
        </CardHeader>
      </Card>
    </Main>
  );
}

export { MaintenancePage };
