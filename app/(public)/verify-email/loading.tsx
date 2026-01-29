import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyEmailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Vérification de l'email en cours"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-lg border bg-white p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="mb-4 space-y-2">
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    </main>
  );
}
