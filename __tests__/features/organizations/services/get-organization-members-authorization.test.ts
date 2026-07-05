import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing the service
// ---------------------------------------------------------------------------

const mockMemberFindFirst = vi.fn();
const mockMemberFindMany = vi.fn();
const mockMemberCount = vi.fn();

const mockTransaction = vi
  .fn()
  .mockImplementation(async (queries: Promise<unknown>[]) =>
    Promise.all(queries),
  );

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findFirst: mockMemberFindFirst,
      findMany: mockMemberFindMany,
      count: mockMemberCount,
    },
    $transaction: mockTransaction,
  },
}));

// Import service AFTER mocks
const { getOrganizationMembers } =
  await import("@/features/organizations/services/get-organization-members.service");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_A_ID = "org-a";
const ORG_B_ID = "org-b";
const USER_IN_ORG_A = "user-a-1";

// ---------------------------------------------------------------------------
// Tests: getOrganizationMembers — service-level membership enforcement
// ---------------------------------------------------------------------------

describe("getOrganizationMembers — service-level membership enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("throws ForbiddenError when userId is not a member of organizationId", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      getOrganizationMembers({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        search: "",
        role: "all",
        sortBy: "createdAt",
        order: "desc",
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("never executes the members query when the caller is not a member", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      getOrganizationMembers({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        search: "",
        role: "all",
        sortBy: "createdAt",
        order: "desc",
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockMemberFindMany).not.toHaveBeenCalled();
    expect(mockMemberCount).not.toHaveBeenCalled();
  });

  it("checks membership with BOTH organizationId and userId — no bypass possible", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      getOrganizationMembers({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        search: "",
        role: "all",
        sortBy: "createdAt",
        order: "desc",
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);

    const membershipArgs = mockMemberFindFirst.mock.calls[0]![0];

    expect(membershipArgs.where.organizationId).toBe(ORG_B_ID);
    expect(membershipArgs.where.userId).toBe(USER_IN_ORG_A);
  });

  it("proceeds to list members when the caller is a member", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockMemberFindMany.mockResolvedValue([]);
    mockMemberCount.mockResolvedValue(0);

    const result = await getOrganizationMembers({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      role: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    expect(result.members).toEqual([]);
    expect(mockMemberFindMany).toHaveBeenCalled();
  });
});
