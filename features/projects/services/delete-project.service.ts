import "server-only";

import { prisma } from "@/lib/prisma";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

type DeleteProjectInput = {
  organizationId: string;
  userId: string;
  projectId: string;
};

async function deleteProject(input: DeleteProjectInput): Promise<void> {
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    throw new ForbiddenError("errors.common.notOrganizationMember");
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId: input.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!existingProject) {
    throw new NotFoundError("errors.projects.notFound");
  }

  await prisma.project.delete({
    where: {
      id: input.projectId,
    },
  });
}

export { deleteProject };
export type { DeleteProjectInput };
