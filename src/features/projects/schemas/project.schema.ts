import { z } from "zod";

import { projectStatuses } from "@/features/projects/constants/project-filters.constant";

/**
 * Messages are translation KEYS (resolved against the `validation` message
 * namespace) — see `utils/errors/translate-field-errors.ts`.
 */
const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(200, "validation.projects.nameTooLong")
    .trim(),
  description: z
    .string()
    .max(2000, "validation.projects.descriptionTooLong")
    .trim()
    .optional(),
  status: z.enum(projectStatuses, {
    message: "validation.projects.invalidStatus",
  }),
});

const UpdateProjectSchema = z.object({
  projectId: z.string().min(1, "validation.projects.projectIdRequired"),
  name: z
    .string()
    .min(1, "validation.name.required")
    .max(200, "validation.projects.nameTooLong")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "validation.projects.descriptionTooLong")
    .trim()
    .optional(),
  status: z
    .enum(projectStatuses, {
      message: "validation.projects.invalidStatus",
    })
    .optional(),
});

const DeleteProjectSchema = z.object({
  projectId: z.string().min(1, "validation.projects.projectIdRequired"),
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
