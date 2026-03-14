import "server-only";

import { cache } from "react";

import type { SubscriptionStatus, User } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type GetUserSession = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
};

type GetUserAccount = {
  id: string;
  accountId: string;
  providerId: string;
  createdAt: Date;
};

type GetUserSubscription = {
  id: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
};

type GetUserStripeCustomer = {
  stripeCustomerId: string;
  subscriptions: GetUserSubscription[];
};

type GetUserResult = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "emailVerified"
  | "image"
  | "role"
  | "slug"
  | "createdAt"
  | "updatedAt"
> & {
  sessions: GetUserSession[];
  accounts: GetUserAccount[];
  stripeCustomer: GetUserStripeCustomer | null;
};

const getUserBySlug = cache(
  async (slug: string): Promise<GetUserResult | null> => {
    return prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        sessions: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        accounts: {
          select: {
            id: true,
            accountId: true,
            providerId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        stripeCustomer: {
          select: {
            stripeCustomerId: true,
            subscriptions: {
              select: {
                id: true,
                stripeSubscriptionId: true,
                stripePriceId: true,
                status: true,
                currentPeriodStart: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
  },
);

export { getUserBySlug };
export type {
  GetUserResult,
  GetUserSession,
  GetUserAccount,
  GetUserSubscription,
  GetUserStripeCustomer,
};
