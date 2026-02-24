import { UserRole } from "@/lib/generated/prisma/client";

const EXACT_COUNT_ROLES: UserRole[] = [UserRole.ADMIN];

function getFuzzyCount(realCount: number, userRole: UserRole): number {
  if (EXACT_COUNT_ROLES.includes(userRole)) {
    return realCount;
  }

  if (realCount === 0) {
    return 0;
  }

  if (realCount < 10) {
    return 10;
  }

  if (realCount < 50) {
    return 50;
  }

  if (realCount < 100) {
    return 100;
  }

  return Math.ceil(realCount / 100) * 100;
}

export { getFuzzyCount };
