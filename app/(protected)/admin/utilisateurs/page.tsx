import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { UserList } from "@/app/(protected)/admin/utilisateurs/_components/user-list";

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
    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <UserList users={users} />
    </main>
  );
}
