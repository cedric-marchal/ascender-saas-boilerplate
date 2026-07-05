import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "@/utils/errors/errors";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Mock prisma BEFORE importing services
// ---------------------------------------------------------------------------

const mockMemberFindFirst = vi.fn();
const mockProjectFindMany = vi.fn();
const mockProjectFindFirst = vi.fn();
const mockProjectCount = vi.fn();
const mockProjectCreate = vi.fn();
const mockProjectUpdate = vi.fn();
const mockProjectDelete = vi.fn();

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
    },
    project: {
      findMany: mockProjectFindMany,
      findFirst: mockProjectFindFirst,
      count: mockProjectCount,
      create: mockProjectCreate,
      update: mockProjectUpdate,
      delete: mockProjectDelete,
    },
    $transaction: mockTransaction,
  },
}));

// Import services AFTER mocks
const { getProjects } =
  await import("@/features/projects/services/get-projects.service");

const { getProject } =
  await import("@/features/projects/services/get-project.service");

const { createProject } =
  await import("@/features/projects/services/create-project.service");

const { updateProject } =
  await import("@/features/projects/services/update-project.service");

const { deleteProject } =
  await import("@/features/projects/services/delete-project.service");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORG_A_ID = "org-a";
const ORG_B_ID = "org-b";
const USER_IN_ORG_A = "user-a-1";
const USER_IN_ORG_B = "user-b-1";
const PROJECT_A_ID = "project-a-1";

function resetMocks() {
  vi.clearAllMocks();
  mockTransaction.mockImplementation(async (queries: Promise<unknown>[]) =>
    Promise.all(queries),
  );
}

// ---------------------------------------------------------------------------
// Tests: getProjects — cross-org isolation
// ---------------------------------------------------------------------------

describe("getProjects — cross-org isolation", () => {
  beforeEach(resetMocks);

  it("throws ForbiddenError when caller is not a member of the requested org", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      getProjects({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A, // Not a member of org B
        search: "",
        status: "all",
        sortBy: "createdAt",
        order: "desc",
        page: 1,
      }),
    ).rejects.toThrow(ForbiddenError);

    // The findMany call must never happen when membership fails
    expect(mockProjectFindMany).not.toHaveBeenCalled();
  });

  it("scopes findMany and count to the requested organizationId", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindMany.mockResolvedValue([]);
    mockProjectCount.mockResolvedValue(0);

    await getProjects({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      status: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    const findManyArgs = mockProjectFindMany.mock.calls[0]![0];
    const countArgs = mockProjectCount.mock.calls[0]![0];

    expect(findManyArgs.where.organizationId).toBe(ORG_A_ID);
    expect(countArgs.where.organizationId).toBe(ORG_A_ID);
    expect(findManyArgs.where.organizationId).not.toBe(ORG_B_ID);
  });

  it("IDOR gate — findMany where clause MUST include organizationId", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindMany.mockResolvedValue([]);
    mockProjectCount.mockResolvedValue(0);

    await getProjects({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      search: "",
      status: "all",
      sortBy: "createdAt",
      order: "desc",
      page: 1,
    });

    const findManyArgs = mockProjectFindMany.mock.calls[0]![0];

    expect(findManyArgs.where).toHaveProperty("organizationId");
    expect(typeof findManyArgs.where.organizationId).toBe("string");
    expect(findManyArgs.where.organizationId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: getProject — the security.md worked example, hardened
// ---------------------------------------------------------------------------

describe("getProject — membership check prevents cross-org read", () => {
  beforeEach(resetMocks);

  it("throws ForbiddenError when user is not a member of the requested org", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      getProject({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A, // User A tries to read a project in org B
        projectId: PROJECT_A_ID,
      }),
    ).rejects.toThrow(ForbiddenError);

    // The project lookup must never happen when membership fails
    expect(mockProjectFindFirst).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the project does not belong to the caller's org", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    // Simulates the project existing in ORG_B, filtered out by the
    // organizationId clause when queried under ORG_A context.
    mockProjectFindFirst.mockResolvedValue(null);

    await expect(
      getProject({
        organizationId: ORG_A_ID,
        userId: USER_IN_ORG_A,
        projectId: PROJECT_A_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("succeeds and scopes the query by organizationId when the user is a member", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue({
      id: PROJECT_A_ID,
      name: "Projet A",
      description: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProject({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      projectId: PROJECT_A_ID,
    });

    expect(result.id).toBe(PROJECT_A_ID);

    const findFirstArgs = mockProjectFindFirst.mock.calls[0]![0];
    expect(findFirstArgs.where.organizationId).toBe(ORG_A_ID);
    expect(findFirstArgs.where.id).toBe(PROJECT_A_ID);
  });

  it("membership check queries BOTH organizationId and userId — no bypass possible", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue({
      id: PROJECT_A_ID,
      name: "Projet A",
      description: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await getProject({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      projectId: PROJECT_A_ID,
    });

    const memberArgs = mockMemberFindFirst.mock.calls[0]![0];

    expect(memberArgs.where.organizationId).toBe(ORG_A_ID);
    expect(memberArgs.where.userId).toBe(USER_IN_ORG_A);
  });
});

// ---------------------------------------------------------------------------
// Tests: createProject — org-scoped write
// ---------------------------------------------------------------------------

describe("createProject — org-scoped write", () => {
  beforeEach(resetMocks);

  it("throws ForbiddenError when caller is not a member of the target org", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      createProject({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        name: "Nouveau projet",
        status: "DRAFT",
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockProjectCreate).not.toHaveBeenCalled();
  });

  it("creates the project scoped to the caller's organizationId", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectCreate.mockResolvedValue({
      id: "project-new",
      name: "Nouveau projet",
      description: null,
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createProject({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      name: "Nouveau projet",
      status: "DRAFT",
    });

    const createArgs = mockProjectCreate.mock.calls[0]![0];
    expect(createArgs.data.organizationId).toBe(ORG_A_ID);
  });
});

// ---------------------------------------------------------------------------
// Tests: updateProject — cross-org write prevention
// ---------------------------------------------------------------------------

describe("updateProject — cross-org write prevention", () => {
  beforeEach(resetMocks);

  it("throws ForbiddenError when caller is not a member of the target org", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      updateProject({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        projectId: PROJECT_A_ID,
        name: "Nom modifié",
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the project does not belong to the caller's org", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue(null);

    await expect(
      updateProject({
        organizationId: ORG_A_ID,
        userId: USER_IN_ORG_A,
        projectId: PROJECT_A_ID,
        name: "Nom modifié",
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });

  it("IDOR gate — the ownership check MUST be scoped by organizationId before update", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue({ id: PROJECT_A_ID });
    mockProjectUpdate.mockResolvedValue({
      id: PROJECT_A_ID,
      name: "Nom modifié",
      description: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateProject({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      projectId: PROJECT_A_ID,
      name: "Nom modifié",
    });

    const findFirstArgs = mockProjectFindFirst.mock.calls[0]![0];
    expect(findFirstArgs.where.organizationId).toBe(ORG_A_ID);
    expect(findFirstArgs.where.id).toBe(PROJECT_A_ID);
  });
});

// ---------------------------------------------------------------------------
// Tests: deleteProject — cross-org delete prevention
// ---------------------------------------------------------------------------

describe("deleteProject — cross-org delete prevention", () => {
  beforeEach(resetMocks);

  it("throws ForbiddenError when caller is not a member of the target org", async () => {
    mockMemberFindFirst.mockResolvedValue(null);

    await expect(
      deleteProject({
        organizationId: ORG_B_ID,
        userId: USER_IN_ORG_A,
        projectId: PROJECT_A_ID,
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(mockProjectDelete).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when the project does not belong to the caller's org (cross-org attempt)", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue(null);

    await expect(
      deleteProject({
        organizationId: ORG_A_ID,
        userId: USER_IN_ORG_B, // simulating a user who guessed a project ID from another org
        projectId: PROJECT_A_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockProjectDelete).not.toHaveBeenCalled();
  });

  it("deletes only after confirming project ownership scoped to organizationId", async () => {
    mockMemberFindFirst.mockResolvedValue({ id: "member-1" });
    mockProjectFindFirst.mockResolvedValue({ id: PROJECT_A_ID });
    mockProjectDelete.mockResolvedValue({ id: PROJECT_A_ID });

    await deleteProject({
      organizationId: ORG_A_ID,
      userId: USER_IN_ORG_A,
      projectId: PROJECT_A_ID,
    });

    const findFirstArgs = mockProjectFindFirst.mock.calls[0]![0];
    expect(findFirstArgs.where.organizationId).toBe(ORG_A_ID);
    expect(mockProjectDelete).toHaveBeenCalledWith({
      where: { id: PROJECT_A_ID },
    });
  });
});
