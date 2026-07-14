import "server-only";

import { prisma } from "@/lib/prisma";

import { slugify } from "@/utils/string/slugify";

type CreateOrganizationInput = {
  userId: string;
  name: string;
};

type CreateOrganizationResult = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
};

async function generateUniqueOrgSlug(name: string): Promise<string> {
  const baseSlug = slugify(name) || "organisation";
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]!;
  const uniqueSuffix = Date.now().toString(36) + randomValue.toString(36);

  return `${baseSlug}-${uniqueSuffix}`;
}

async function createOrganization(
  input: CreateOrganizationInput,
): Promise<CreateOrganizationResult> {
  const slug = await generateUniqueOrgSlug(input.name);
  const orgId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  const organization = await prisma.organization.create({
    data: {
      id: orgId,
      name: input.name,
      slug,
      members: {
        create: {
          id: memberId,
          userId: input.userId,
          role: "owner",
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
    },
  });

  return organization;
}

export { createOrganization, generateUniqueOrgSlug };
export type { CreateOrganizationResult };
