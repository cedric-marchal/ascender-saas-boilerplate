import { UserCardSkeleton } from "./_components/user-card-skeleton";

export default function UsersPageLoading() {
  return (
    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index: number) => (
          <UserCardSkeleton key={index} />
        ))}
      </section>
    </main>
  );
}
