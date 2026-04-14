import Link from "next/link";

import { ArrowRight, CreditCard, FolderKanban, Settings } from "lucide-react";

import { Main } from "@/components/main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type DashboardHomePageProps = {
  userName: string;
};

type QuickAction = {
  title: string;
  description: string;
  href:
    | "/dashboard/projets"
    | "/dashboard/facturation"
    | "/dashboard/parametres";
  icon: typeof FolderKanban;
  color: string;
  iconColor: string;
};

const quickActions = [
  {
    title: "Projets",
    description: "Gérez vos projets et suivez leur avancement",
    href: "/dashboard/projets" as const,
    icon: FolderKanban,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Facturation",
    description: "Consultez vos factures et abonnements",
    href: "/dashboard/facturation" as const,
    icon: CreditCard,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "Paramètres",
    description: "Modifiez votre profil et vos préférences",
    href: "/dashboard/parametres" as const,
    icon: Settings,
    color: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
] satisfies QuickAction[];

function DashboardHomePage({ userName }: DashboardHomePageProps) {
  const firstName = userName.split(" ")[0];

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {`Bonjour, ${firstName}`}
        </h1>
        <p className="text-muted-foreground text-sm">
          Bienvenue sur votre tableau de bord
        </p>
      </header>

      <Separator />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action: (typeof quickActions)[number]) => (
          <Link key={action.href} href={action.href} className="group">
            <Card className="group-hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${action.color}`}
                >
                  <action.icon
                    className={`size-5 ${action.iconColor}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </div>
                <ArrowRight
                  className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Vos dernières actions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
            Aucune activité récente
          </div>
        </CardContent>
      </Card>
    </Main>
  );
}

export { DashboardHomePage };
