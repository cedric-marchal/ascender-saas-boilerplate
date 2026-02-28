import { Main } from "@/components/main";

type DashboardHomePageProps = {
  userName: string;
};

function DashboardHomePage({ userName }: DashboardHomePageProps) {
  return (
    <Main className="flex flex-col px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Bienvenue, {userName}</p>
    </Main>
  );
}

export { DashboardHomePage };
