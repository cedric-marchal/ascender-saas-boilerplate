import { UserRole } from "@/lib/generated/prisma/client";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  CUSTOMER: "Client",
};

export { roleLabels, UserRole };
