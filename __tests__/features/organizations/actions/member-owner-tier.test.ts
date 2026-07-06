import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing the actions
// ---------------------------------------------------------------------------

const mockHeaders = vi.fn();
const mockGetSession = vi.fn();
const mockMemberFindFirst = vi.fn();
const mockMemberCount = vi.fn();
const mockMemberDelete = vi.fn();
const mockMemberUpdate = vi.fn();
const mockTransaction = vi.fn();
const mockLogEvent = vi.fn();
const mockRevalidateLocalizedPath = vi.fn();

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn().mockResolvedValue("en"),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      // orgActionClient reads membership via the global client (outside the tx)
      findFirst: mockMemberFindFirst,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/features/organizations/services/audit-log.service", () => ({
  logEvent: mockLogEvent,
}));

vi.mock("@/i18n/revalidate-localized-path", () => ({
  revalidateLocalizedPath: mockRevalidateLocalizedPath,
}));

// Import actions AFTER mocks
const { removeMemberAction } =
  await import("@/features/organizations/actions/remove-member.action");
const { changeMemberRoleAction } =
  await import("@/features/organizations/actions/change-member-role.action");

const ACTOR_USER_ID = "user-actor-1";
const ORGANIZATION_ID = "org-1";
const TARGET_MEMBER_ID = "member-target-1";
const REMOVE_OWNER_FORBIDDEN_MESSAGE = "Only an owner can remove another owner";
const CHANGE_OWNER_ROLE_FORBIDDEN_MESSAGE =
  "Only an owner can change another owner's role";

// actorRole drives the orgActionClient membership lookup (global findFirst),
// targetRole drives the in-transaction target lookup. remainingOwners is what
// the in-transaction owner recount returns when the target is an owner.
function setup(actorRole: string, targetRole: string, remainingOwners = 1) {
  mockGetSession.mockResolvedValue({
    user: {
      id: ACTOR_USER_ID,
      email: "actor@example.com",
      name: "Actor",
      role: "CUSTOMER",
    },
    activeOrganizationId: ORGANIZATION_ID,
  });

  // orgActionClient membership lookup (where.userId).
  mockMemberFindFirst.mockResolvedValue({ role: actorRole });

  mockMemberCount.mockResolvedValue(remainingOwners);
  mockMemberDelete.mockResolvedValue({ id: TARGET_MEMBER_ID });
  mockMemberUpdate.mockResolvedValue({ id: TARGET_MEMBER_ID });

  mockTransaction.mockImplementation(
    async (callback: (tx: unknown) => unknown) =>
      callback({
        member: {
          findFirst: vi.fn().mockResolvedValue({
            id: TARGET_MEMBER_ID,
            userId: "user-target-1",
            role: targetRole,
          }),
          count: mockMemberCount,
          delete: mockMemberDelete,
          update: mockMemberUpdate,
        },
      }),
  );
}

describe("owner-tier authorization on member mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockLogEvent.mockResolvedValue(undefined);
  });

  describe("removeMemberAction", () => {
    it("rejects an admin removing an owner, even when not the last owner", async () => {
      setup("admin", "owner", 2);

      const result = await removeMemberAction({ memberId: TARGET_MEMBER_ID });

      expect(result?.serverError).toBe(REMOVE_OWNER_FORBIDDEN_MESSAGE);
      expect(mockMemberDelete).not.toHaveBeenCalled();
    });

    it("allows an owner to remove a co-owner who is not the last owner", async () => {
      setup("owner", "owner", 1);

      const result = await removeMemberAction({ memberId: TARGET_MEMBER_ID });

      expect(result?.data?.success).toBe(true);
      expect(mockMemberDelete).toHaveBeenCalled();
    });

    it("rejects removing the last owner", async () => {
      setup("owner", "owner", 0);

      const result = await removeMemberAction({ memberId: TARGET_MEMBER_ID });

      expect(result?.serverError).toBeDefined();
      expect(mockMemberDelete).not.toHaveBeenCalled();
    });

    it("still allows an admin to remove a regular member", async () => {
      setup("admin", "member");

      const result = await removeMemberAction({ memberId: TARGET_MEMBER_ID });

      expect(result?.data?.success).toBe(true);
      expect(mockMemberDelete).toHaveBeenCalled();
    });
  });

  describe("changeMemberRoleAction", () => {
    it("rejects an admin demoting an owner, even when not the last owner", async () => {
      setup("admin", "owner", 2);

      const result = await changeMemberRoleAction({
        memberId: TARGET_MEMBER_ID,
        role: "member",
      });

      expect(result?.serverError).toBe(CHANGE_OWNER_ROLE_FORBIDDEN_MESSAGE);
      expect(mockMemberUpdate).not.toHaveBeenCalled();
    });

    it("allows an owner to demote a co-owner who is not the last owner", async () => {
      setup("owner", "owner", 1);

      const result = await changeMemberRoleAction({
        memberId: TARGET_MEMBER_ID,
        role: "admin",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockMemberUpdate).toHaveBeenCalled();
    });

    it("still allows an admin to change a regular member's role", async () => {
      setup("admin", "member");

      const result = await changeMemberRoleAction({
        memberId: TARGET_MEMBER_ID,
        role: "admin",
      });

      expect(result?.data?.success).toBe(true);
      expect(mockMemberUpdate).toHaveBeenCalled();
    });
  });
});
