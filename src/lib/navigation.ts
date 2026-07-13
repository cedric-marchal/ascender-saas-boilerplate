import { UserRole } from "@/lib/generated/prisma/browser";

const ROLE_DASHBOARD_URL = {
  [UserRole.ADMIN]: "/admin",
  [UserRole.CUSTOMER]: "/dashboard",
} as const satisfies Record<UserRole, string>;

export { ROLE_DASHBOARD_URL };
