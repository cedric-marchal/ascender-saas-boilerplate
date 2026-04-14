import { Settings } from "lucide-react";

function SettingsHeader() {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <Settings className="text-primary size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>
      </div>
    </header>
  );
}

export { SettingsHeader };
