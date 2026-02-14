import {
  userRoleFilters,
  verificationFilters,
} from "@/features/users/constants";
import { z } from "zod";

import { FILTERS } from "@/lib/constants/query.constant";

const FilterUsersSchema = z.object({
  search: z
    .string()
    .max(
      FILTERS.maxSearchLength,
      `La recherche doit contenir moins de ${FILTERS.maxSearchLength} caractères`
    )
    .trim(),
  role: z.enum(userRoleFilters, {
    message: "Rôle invalide",
  }),
  verified: z.enum(verificationFilters, {
    message: "Statut de vérification invalide",
  }),
});

type FilterUsersSchemaType = z.infer<typeof FilterUsersSchema>;

export { FilterUsersSchema };

export type { FilterUsersSchemaType };
