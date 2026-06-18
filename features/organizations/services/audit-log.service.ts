import "server-only";

import type { AuditAction } from "@/features/organizations/constants/audit-actions.constant";

import { prisma } from "@/lib/prisma";

type LogEventInput = {
  organizationId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as object) ?? undefined,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to write audit log:", error);
  }
}

export { logEvent };

export type { LogEventInput };
