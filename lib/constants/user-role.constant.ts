import type { UserRole } from "@/lib/generated/prisma/client";

type UserRoleConfig = {
  label: string;
  color: "indigo" | "blue" | "green" | "red" | "gray";
};

const USER_ROLE_CONFIG: Record<UserRole, UserRoleConfig> = {
  ADMIN: {
    label: "Administrateur",
    color: "indigo",
  },
  CUSTOMER: {
    label: "Client",
    color: "blue",
  },
};

export { USER_ROLE_CONFIG };

export type { UserRoleConfig };
