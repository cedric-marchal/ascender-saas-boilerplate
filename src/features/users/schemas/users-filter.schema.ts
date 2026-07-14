import { z } from "zod";

import {
  userRoleFilters,
  verificationFilters,
} from "@/features/users/constants/users-filters.constant";

import { MAX_SEARCH_LENGTH } from "@/lib/parsers/filters";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`. `MAX_SEARCH_LENGTH`
 * is a fixed constant (not user input), so the translated text in
 * `messages/*.json` embeds the number directly instead of interpolating.
 */
const FilterUsersSchema = z.object({
  search: z
    .string()
    .max(MAX_SEARCH_LENGTH, "validation.users.searchTooLong")
    .trim(),
  role: z.enum(userRoleFilters, {
    message: "validation.users.invalidRole",
  }),
  verified: z.enum(verificationFilters, {
    message: "validation.users.invalidVerification",
  }),
});

export { FilterUsersSchema };
