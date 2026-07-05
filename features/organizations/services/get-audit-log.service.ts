import "server-only";

import { getTranslator } from "@/i18n/get-translator";
import { getLocale } from "next-intl/server";

import { PAGE_SIZE } from "@/lib/parsers/filters";
import { prisma } from "@/lib/prisma";

import { ForbiddenError } from "@/utils/errors/errors";

type GetAuditLogInput = {
  organizationId: string;
  userId: string;
  page: number;
};

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
};

type GetAuditLogResult = {
  entries: AuditLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

async function getAuditLog(
  input: GetAuditLogInput,
): Promise<GetAuditLogResult> {
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
    },
    select: {
      role: true,
    },
  });

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    throw new ForbiddenError("errors.organizations.auditLogForbidden");
  }

  const whereClause = {
    organizationId: input.organizationId,
  };

  const [entries, totalCount] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where: whereClause,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        userId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (input.page - 1) * PAGE_SIZE.SMALL,
      take: PAGE_SIZE.SMALL,
    }),
    prisma.auditLog.count({
      where: whereClause,
    }),
  ]);

  const locale = await getLocale();
  const translate = getTranslator(locale);

  const userIds = [...new Set(entries.map((entry) => entry.userId))];

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  const enrichedEntries: AuditLogItem[] = entries.map((entry) => {
    const user = userMap.get(entry.userId);

    return {
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      user: {
        name: user?.name ?? translate("organizations.auditLog.unknownUser"),
        email: user?.email ?? "",
      },
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE.SMALL));

  return {
    entries: enrichedEntries,
    totalCount,
    totalPages,
    currentPage: input.page,
  };
}

export { getAuditLog };

export type { AuditLogItem, GetAuditLogInput, GetAuditLogResult };
