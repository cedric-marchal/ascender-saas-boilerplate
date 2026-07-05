import { z } from "zod";

import { projectStatuses } from "@/features/projects/constants/project-filters.constant";

const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim(),
  description: z
    .string()
    .max(2000, "La description doit contenir moins de 2000 caractères")
    .trim()
    .optional(),
  status: z.enum(projectStatuses, {
    message: "Statut invalide",
  }),
});

const UpdateProjectSchema = z.object({
  projectId: z.string().min(1, "L'identifiant du projet est requis"),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(200, "Le nom doit contenir moins de 200 caractères")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "La description doit contenir moins de 2000 caractères")
    .trim()
    .optional(),
  status: z
    .enum(projectStatuses, {
      message: "Statut invalide",
    })
    .optional(),
});

const DeleteProjectSchema = z.object({
  projectId: z.string().min(1, "L'identifiant du projet est requis"),
});

type CreateProjectSchemaType = z.infer<typeof CreateProjectSchema>;
type UpdateProjectSchemaType = z.infer<typeof UpdateProjectSchema>;
type DeleteProjectSchemaType = z.infer<typeof DeleteProjectSchema>;

export { CreateProjectSchema, DeleteProjectSchema, UpdateProjectSchema };
export type {
  CreateProjectSchemaType,
  DeleteProjectSchemaType,
  UpdateProjectSchemaType,
};
