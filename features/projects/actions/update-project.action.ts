"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { UpdateProjectSchema } from "@/features/projects/schemas/project.schema";
import { updateProject } from "@/features/projects/services/update-project.service";

import { orgActionClient } from "@/lib/safe-action";

const updateProjectAction = orgActionClient
  .inputSchema(UpdateProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const project = await updateProject({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      projectId: parsedInput.projectId,
      name: parsedInput.name,
      description: parsedInput.description,
      status: parsedInput.status,
    });

    revalidateLocalizedPath("/dashboard/projects");

    return {
      success: true,
      project,
    };
  });

export { updateProjectAction };
