import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing services
// ---------------------------------------------------------------------------

const mockMemberFindFirst = vi.fn();
const mockMemberFindMany = vi.fn();
const mockMemberCount = vi.fn();
const mockOrganizationFindUnique = vi.fn();
const mockAuditLogFindMany = vi.fn();
const mockAuditLogCount = vi.fn();
const mockUserFindMany = vi.fn();

// $transaction executes the array of prisma calls passed to it and returns results
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
    organization: {
      findUnique: mockOrganizationFindUnique,
    },
    auditLog: {
      findMany: mockAuditLogFindMany,
      count: mockAuditLogCount,
    },
    user: {
      findMany: mockUserFindMany,
    },
    $transaction: mockTransaction,
  },
}));

// Import services AFTER mocks
const { getOrganizationMembers } =
  await import("@/features/organizations/services/get-organization-members.service");

const { getOrganization } =
  await import("@/features/organizations/services/get-organization.service");

const { getAuditLog } =
  await import("@/features/organizations/services/get-audit-log.service");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_A_ID = "org-a";
const ORG_B_ID = "org-b";
const USER_IN_ORG_A = "user-a-1";
const USER_IN_ORG_B = "user-b-1";

// ---------------------------------------------------------------------------
// Tests: getOrganizationMembers cross-org isolation
// ---------------------------------------------------------------------------

describe("getOrganizationMembers — cross-org isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("returns members only for the requested organizationId", async () => {
    const orgAMembers = [
      {
        id: "member-a-1",
        userId: USER_IN_ORG_A,
        role: "owner",
        createdAt: new Date(),
        user: { name: "Alice", email: "alice@example.com", image: null },
      },
    ];

    mockMemberFindMany.mockResolvedValue(orgAMembers);
    mockMemberCount.mockResolvedValue(1);

    const result = await getOrganizationMembers({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      role: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    // findMany must be called with organizationId scoped to ORG_A_ID
    expect(mockMemberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: ORG_A_ID,
        }),
      }),
    );

    expect(result.members).toHaveLength(1);
    expect(result.members[0]!.userId).toBe(USER_IN_ORG_A);
  });

  it("does NOT leak org B members when calling with org A context", async () => {
    mockMemberFindMany.mockResolvedValue([]);
    mockMemberCount.mockResolvedValue(0);

    await getOrganizationMembers({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      role: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    const findManyArgs = mockMemberFindMany.mock.calls[0]![0];
    const countArgs = mockMemberCount.mock.calls[0]![0];

    // Both findMany and count MUST filter by organizationId = ORG_A_ID
    expect(findManyArgs.where.organizationId).toBe(ORG_A_ID);
    expect(countArgs.where.organizationId).toBe(ORG_A_ID);

    // They must NOT be set to org B
    expect(findManyArgs.where.organizationId).not.toBe(ORG_B_ID);
    expect(countArgs.where.organizationId).not.toBe(ORG_B_ID);
  });

  it("IDOR gate — findMany where clause MUST include organizationId", async () => {
    mockMemberFindMany.mockResolvedValue([]);
    mockMemberCount.mockResolvedValue(0);

    await getOrganizationMembers({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      role: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    const findManyArgs = mockMemberFindMany.mock.calls[0]![0];

    // This assertion FAILS if organizationId is removed from the where clause
    expect(findManyArgs.where).toHaveProperty("organizationId");
    expect(typeof findManyArgs.where.organizationId).toBe("string");
    expect(findManyArgs.where.organizationId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: getOrganization cross-org isolation
// ---------------------------------------------------------------------------

describe("getOrganization — membership check prevents cross-org read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("throws ForbiddenError when user is not a member of the requested org", async () => {
    // User A tries to read org B — but they are not a member
    mockOrganizationFindUnique.mockResolvedValue({
      id: ORG_B_ID,
      name: "Org B",
      slug: "org-b",
      logo: null,
      createdAt: new Date(),
      members: [], // No membership for USER_IN_ORG_A in org B
    });
    mockMemberCount.mockResolvedValue(2);

    await expect(
      getOrganization({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A, // User A tries to read org B
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("succeeds when user is a member of the requested org", async () => {
    mockOrganizationFindUnique.mockResolvedValue({
      id: ORG_A_ID,
      name: "Org A",
      slug: "org-a",
      logo: null,
      createdAt: new Date(),
      members: [{ role: "owner" }],
    });
    mockMemberCount.mockResolvedValue(1);

    const result = await getOrganization({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
    });

    expect(result.id).toBe(ORG_A_ID);
    expect(result.role).toBe("owner");
  });

  it("always queries the org with userId filter in members — cross-org check", async () => {
    mockOrganizationFindUnique.mockResolvedValue({
      id: ORG_A_ID,
      name: "Org A",
      slug: "org-a",
      logo: null,
      createdAt: new Date(),
      members: [{ role: "member" }],
    });
    mockMemberCount.mockResolvedValue(3);

    await getOrganization({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
    });

    const findUniqueArgs = mockOrganizationFindUnique.mock.calls[0]![0];

    // The members sub-query must filter by userId to prevent cross-org access
    expect(findUniqueArgs.select.members.where.userId).toBe(USER_IN_ORG_A);
    // And the organization id must match
    expect(findUniqueArgs.where.id).toBe(ORG_A_ID);
  });
});

// ---------------------------------------------------------------------------
// Tests: getAuditLog — org-scoped + role enforcement
// ---------------------------------------------------------------------------

describe("getAuditLog — org-scoped access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("throws ForbiddenError when user is not owner/admin of the org", async () => {
    // User is a "member" (not owner/admin)
    mockMemberFindFirst.mockResolvedValue({ role: "member" });

    await expect(
      getAuditLog({
        organizationId: ORG_A_ID,
        userId: USER_IN_ORG_A,
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when user is not a member at all (cross-org attempt)", async () => {
    // USER_IN_ORG_B attempts to read org A's audit log
    mockMemberFindFirst.mockResolvedValue(null); // No membership

    await expect(
      getAuditLog({
        organizationId: ORG_A_ID,
        userId: USER_IN_ORG_B, // Cross-org attempt
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("returns only org A audit log when user is owner of org A", async () => {
    mockMemberFindFirst.mockResolvedValue({ role: "owner" });

    const fakeEntries = [
      {
        id: "audit-1",
        action: "MEMBER_INVITED",
        entityType: "invitation",
        entityId: null,
        metadata: null,
        createdAt: new Date(),
        userId: USER_IN_ORG_A,
      },
    ];

    mockAuditLogFindMany.mockResolvedValue(fakeEntries);
    mockAuditLogCount.mockResolvedValue(1);
    mockUserFindMany.mockResolvedValue([
      { id: USER_IN_ORG_A, name: "Alice", email: "alice@example.com" },
    ]);

    const result = await getAuditLog({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      page: 1,
    });

    // Verify findMany was called with org A scope
    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: ORG_A_ID,
        }),
      }),
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.action).toBe("MEMBER_INVITED");
  });

  it("IDOR gate — audit log findMany MUST include organizationId in where clause", async () => {
    mockMemberFindFirst.mockResolvedValue({ role: "admin" });

    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);

    await getAuditLog({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      page: 1,
    });

    const findManyArgs = mockAuditLogFindMany.mock.calls[0]![0];

    // This assertion FAILS if organizationId is removed from the where clause
    expect(findManyArgs.where).toHaveProperty("organizationId");
    expect(findManyArgs.where.organizationId).toBe(ORG_A_ID);
  });

  it("membership check queries BOTH organizationId and userId — no bypass possible", async () => {
    mockMemberFindFirst.mockResolvedValue({ role: "owner" });

    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(0);
    mockUserFindMany.mockResolvedValue([]);

    await getAuditLog({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      page: 1,
    });

    const memberArgs = mockMemberFindFirst.mock.calls[0]![0];

    // Must check BOTH organizationId AND userId in the membership lookup
    expect(memberArgs.where.organizationId).toBe(ORG_A_ID);
    expect(memberArgs.where.userId).toBe(USER_IN_ORG_A);
  });
});
