import { FolderKanban } from "lucide-react";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function ProjectsPage() {
  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
          <FolderKanban className="size-5 text-blue-500" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos projets et suivez leur avancement
          </p>
        </div>
      </header>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Mes projets</CardTitle>
          <CardDescription>Retrouvez tous vos projets ici</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
            Aucun projet pour le moment
          </div>
        </CardContent>
      </Card>
    </Main>
  );
}

export { ProjectsPage };
