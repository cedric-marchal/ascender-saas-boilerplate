import "server-only";

import { cache } from "react";

import { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type PricingUserStatus = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isCustomer: boolean;
};

const getPricingUserStatus = cache(
  async (userId: string | null): Promise<PricingUserStatus> => {
    if (!userId) {
      return {
        isAuthenticated: false,
        isEmailVerified: false,
        isCustomer: false,
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        emailVerified: true,
        role: true,
      },
    });

    return {
      isAuthenticated: true,
      isEmailVerified: user?.emailVerified ?? false,
      isCustomer: user?.role === UserRole.CUSTOMER,
    };
  },
);

export { getPricingUserStatus };
export type { PricingUserStatus };
