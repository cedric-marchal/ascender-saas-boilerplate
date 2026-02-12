import { UserRole } from "@/lib/generated/prisma/client";

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

export function parseUserRole(role: string): UserRole {
  if (!Object.values(UserRole).includes(role as UserRole)) {
    throw new Error(`Role invalide dans la session: ${role}`);
  }

  return role as UserRole;
}

export { USER_ROLE_CONFIG };

export type { UserRoleConfig };
