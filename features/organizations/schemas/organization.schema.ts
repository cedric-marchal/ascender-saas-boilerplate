import { z } from "zod";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(100, "validation.name.tooLong")
    .trim(),
});

const UpdateOrganizationSchema = z.object({
  organizationId: z
    .string()
    .min(1, "validation.organizations.organizationIdRequired"),
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(100, "validation.name.tooLong")
    .trim()
    .optional(),
  logo: z
    .string()
    .max(500, "validation.organizations.logoUrlTooLong")
    .trim()
    .optional(),
});

type CreateOrganizationSchemaType = z.infer<typeof CreateOrganizationSchema>;
type UpdateOrganizationSchemaType = z.infer<typeof UpdateOrganizationSchema>;

export { CreateOrganizationSchema, UpdateOrganizationSchema };
export type { CreateOrganizationSchemaType, UpdateOrganizationSchemaType };
