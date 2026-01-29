import { Settings } from "lucide-react";

function DashboardSettingsHeader() {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>
      </div>
    </header>
  );
}

export { DashboardSettingsHeader };
