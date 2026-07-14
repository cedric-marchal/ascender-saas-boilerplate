import "server-only";

import type { ProjectStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

type CreateProjectInput = {
  organizationId: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
};

type CreateProjectResult = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
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

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
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

  return project;
}

export { createProject };
export type { CreateProjectInput, CreateProjectResult };
