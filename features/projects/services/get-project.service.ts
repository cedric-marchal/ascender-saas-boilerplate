import "server-only";

import type { ProjectStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

type GetProjectInput = {
  organizationId: string;
  userId: string;
  projectId: string;
};

type GetProjectResult = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

async function getProject(input: GetProjectInput): Promise<GetProjectResult> {
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

  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId: input.organizationId,
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

  if (!project) {
    throw new NotFoundError("Projet introuvable");
  }

  return project;
}

export { getProject };
export type { GetProjectInput, GetProjectResult };
