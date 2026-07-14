import { useTranslations } from "next-intl";

import { Main } from "@/components/main";
import { Skeleton } from "@/components/ui/skeleton";

function PricingLoading() {
  const t = useTranslations("pricing");

  return (
    <Main aria-busy="true" aria-label={t("loadingLabel")}>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 md:gap-12 md:py-16 lg:px-8 lg:py-20">
        <header className="space-y-4 text-center">
          <Skeleton className="mx-auto h-10 w-3/4 sm:w-1/2" />
          <Skeleton className="mx-auto h-4 w-full max-w-2xl" />
          <Skeleton className="mx-auto h-4 w-4/5 max-w-xl" />
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index: number) => (
            <div key={index} className="space-y-4 rounded-lg border p-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="space-y-1">
                <Skeleton className="h-8 w-28" />
              </div>

              <ul className="space-y-2">
                {Array.from({ length: 4 }).map((__, featureIndex: number) => (
                  <li key={featureIndex}>
                    <Skeleton className="h-4 w-full" />
                  </li>
                ))}
              </ul>

              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>

        <Skeleton className="mx-auto h-3 w-3/4 max-w-lg" />
      </section>
    </Main>
  );
}

export { PricingLoading };
