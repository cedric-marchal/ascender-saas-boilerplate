import type { Metadata } from "next";

import { Activity, DollarSign, TrendingUp, Users } from "lucide-react";

import { requireAdmin } from "@/lib/session";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Administration",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Tableau de bord admin
        </h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la plateforme et des statistiques
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs totaux
            </CardTitle>
            <Users
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenus mensuels
            </CardTitle>
            <DollarSign
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 €</div>
            <p className="text-muted-foreground text-xs">
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs actifs
            </CardTitle>
            <Activity
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-muted-foreground text-xs">
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de croissance
            </CardTitle>
            <TrendingUp
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0%</div>
            <p className="text-muted-foreground text-xs">
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Les dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
              Aucune activité récente
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>Aperçu des métriques clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nouveaux comptes</span>
                <span className="text-muted-foreground text-sm">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Abonnements actifs</span>
                <span className="text-muted-foreground text-sm">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Support tickets</span>
                <span className="text-muted-foreground text-sm">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
