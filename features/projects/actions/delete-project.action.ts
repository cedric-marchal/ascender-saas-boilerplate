"use server";

import { revalidatePath } from "next/cache";

import { DeleteProjectSchema } from "@/features/projects/schemas/project.schema";
import { deleteProject } from "@/features/projects/services/delete-project.service";

import { orgActionClient } from "@/lib/safe-action";

const deleteProjectAction = orgActionClient
  .inputSchema(DeleteProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    await deleteProject({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      projectId: parsedInput.projectId,
    });

    revalidatePath("/dashboard/projets");

    return {
      success: true,
    };
  });

export { deleteProjectAction };
