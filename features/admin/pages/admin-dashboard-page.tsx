import Link from "next/link";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CreditCard,
  TrendingUp,
  Users,
} from "lucide-react";

import type {
  AdminDashboardMetrics,
  RecentUser,
} from "@/features/admin/services/get-admin-dashboard.service";

import { Main } from "@/components/main";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getAvatarUrl } from "@/utils/string/get-avatar-url";
import { getInitials } from "@/utils/string/get-initials";

type AdminDashboardPageProps = {
  metrics: AdminDashboardMetrics;
};

function formatGrowth(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }

  const growth = Math.round(((current - previous) / previous) * 100);

  return `${growth > 0 ? "+" : ""}${growth}%`;
}

function AdminDashboardPage({ metrics }: AdminDashboardPageProps) {
  const userGrowth = formatGrowth(
    metrics.newUsersThisMonth,
    metrics.newUsersLastMonth,
  );

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground text-sm">
          Vue d'ensemble de la plateforme et des statistiques
        </p>
      </header>

      <Separator />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs totaux
            </CardTitle>
            <div className="bg-primary/10 flex size-8 items-center justify-center rounded-md">
              <Users className="text-primary size-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-muted-foreground text-xs">
              {userGrowth} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Abonnements actifs
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10">
              <CreditCard
                className="size-4 text-emerald-500"
                aria-hidden="true"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeSubscriptions}
            </div>
            <p className="text-muted-foreground text-xs">
              Abonnements en cours ou en essai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions actives
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-md bg-blue-500/10">
              <Activity className="size-4 text-blue-500" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSessions}</div>
            <p className="text-muted-foreground text-xs">
              Utilisateurs actuellement connectés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Croissance mensuelle
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-md bg-orange-500/10">
              <TrendingUp
                className="size-4 text-orange-500"
                aria-hidden="true"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userGrowth}</div>
            <p className="text-muted-foreground text-xs">
              {metrics.newUsersThisMonth} nouveau
              {metrics.newUsersThisMonth > 1 ? "x" : ""} ce mois
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Derniers inscrits</CardTitle>
              <CardDescription>
                Les 5 derniers utilisateurs inscrits
              </CardDescription>
            </div>
            <Link
              href="/admin/utilisateurs"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
            >
              Voir tout
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {metrics.recentUsers.length === 0 ? (
              <div className="text-muted-foreground flex h-48 items-center justify-center rounded-lg border border-dashed text-sm">
                Aucun utilisateur inscrit
              </div>
            ) : (
              <ul className="divide-y">
                {metrics.recentUsers.map((user: RecentUser) => (
                  <li key={user.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/admin/utilisateurs/${user.slug}`}
                      className="flex items-center justify-between gap-3 transition-opacity hover:opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {user.image ? (
                            <AvatarImage
                              src={getAvatarUrl(user.image)}
                              alt={`${user.name} avatar`}
                            />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(user.createdAt))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>Aperçu des métriques clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 size-2 rounded-full" />
                  <span className="text-sm font-medium">Nouveaux ce mois</span>
                </div>
                <span className="text-sm font-semibold">
                  {metrics.newUsersThisMonth}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500/20" />
                  <span className="text-sm font-medium">
                    Abonnements actifs
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {metrics.activeSubscriptions}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500/20" />
                  <span className="text-sm font-medium">Emails vérifiés</span>
                </div>
                <span className="text-sm font-semibold">
                  <span className="flex items-center gap-1">
                    <BadgeCheck
                      className="size-3 text-blue-500"
                      aria-hidden="true"
                    />
                    {metrics.verifiedUsers}/{metrics.totalUsers}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </Main>
  );
}

export { AdminDashboardPage };
