import "server-only";

import type { ProjectStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

type UpdateProjectInput = {
  organizationId: string;
  userId: string;
  projectId: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
};

type UpdateProjectResult = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

async function updateProject(
  input: UpdateProjectInput,
): Promise<UpdateProjectResult> {
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
    throw new ForbiddenError("Vous n'êtes pas membre de cette organisation");
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
    throw new NotFoundError("Projet introuvable");
  }

  const project = await prisma.project.update({
    where: {
      id: input.projectId,
    },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.status !== undefined && { status: input.status }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return project;
}

export { updateProject };
export type { UpdateProjectInput, UpdateProjectResult };
