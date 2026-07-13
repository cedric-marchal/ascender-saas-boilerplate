"use server";

import { revalidateLocalizedPath } from "@/i18n/revalidate-localized-path";

import { requireOrganizationPlan } from "@/features/billing/guards/require-organization-plan";
import { CreateProjectSchema } from "@/features/projects/schemas/project.schema";
import { createProject } from "@/features/projects/services/create-project.service";

import { orgActionClient } from "@/lib/safe-action";

const createProjectAction = orgActionClient
  .inputSchema(CreateProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    await requireOrganizationPlan(ctx.organizationId, "pro");

    const project = await createProject({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
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

export { createProjectAction };
