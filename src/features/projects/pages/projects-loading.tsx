import { useTranslations } from "next-intl";

import { Main } from "@/components/main";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectsLoading() {
  const t = useTranslations("projects");

  return (
    <Main
      className="flex flex-col gap-6 p-6"
      aria-busy="true"
      aria-label={t("loadingLabel")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Separator />

      <div className="flex flex-col gap-4 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="flex gap-4 border-b p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          {Array.from({ length: 5 }).map((_, index: number) => (
            <div key={index} className="flex items-center gap-4 border-b p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </Main>
  );
}

export { ProjectsLoading };
