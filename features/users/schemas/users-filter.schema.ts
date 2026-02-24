import { z } from "zod";

import {
  userRoleFilters,
  verificationFilters,
} from "@/features/users/constants/users-filters.constant";

import { MAX_SEARCH_LENGTH } from "@/lib/parsers/nuqs";

const FilterUsersSchema = z.object({
  search: z
    .string()
    .max(
      MAX_SEARCH_LENGTH,
      `La recherche doit contenir moins de ${MAX_SEARCH_LENGTH} caractères`,
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
