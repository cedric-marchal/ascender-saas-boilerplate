import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { SubscriptionStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type AdminDashboardMetrics = {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  activeSubscriptions: number;
  activeSessions: number;
  verifiedUsers: number;
  recentUsers: RecentUser[];
};

type RecentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  slug: string;
  createdAt: Date;
};

async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeSubscriptions,
    activeSessions,
    verifiedUsers,
    recentUsers,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),
    prisma.subscription.count({
      where: {
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
    }),
    prisma.session.count({
      where: { expiresAt: { gt: now } },
    }),
    prisma.user.count({
      where: { emailVerified: true },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        slug: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeSubscriptions,
    activeSessions,
    verifiedUsers,
    recentUsers,
  };
}

async function getCachedAdminDashboard(): Promise<AdminDashboardMetrics> {
  "use cache";

  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("admin-dashboard");

  return getAdminDashboard();
}

export { getAdminDashboard, getCachedAdminDashboard };

export type { AdminDashboardMetrics, RecentUser };
