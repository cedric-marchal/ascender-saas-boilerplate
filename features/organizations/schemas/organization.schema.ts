import { z } from "zod";

const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim(),
});

const UpdateOrganizationSchema = z.object({
  organizationId: z
    .string()
    .min(1, "L'identifiant de l'organisation est requis"),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom doit contenir moins de 100 caractères")
    .trim()
    .optional(),
  logo: z
    .string()
    .max(500, "L'URL du logo doit contenir moins de 500 caractères")
    .trim()
    .optional(),
});

type CreateOrganizationSchemaType = z.infer<typeof CreateOrganizationSchema>;
type UpdateOrganizationSchemaType = z.infer<typeof UpdateOrganizationSchema>;

export { CreateOrganizationSchema, UpdateOrganizationSchema };
export type { CreateOrganizationSchemaType, UpdateOrganizationSchemaType };
