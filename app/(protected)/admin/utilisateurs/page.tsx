import type { Metadata } from "next";

import { UserList } from "@/app/(protected)/admin/utilisateurs/_components/user-list";
import { prisma } from "@/lib/prisma";

import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Utilisateurs",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      image: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <UserList users={users} />
    </main>
  );
}
