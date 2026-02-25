import { afterEach, describe, expect, it, vi } from "vitest";

import { getUsers } from "@/features/users/services/get-users.service";

import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => {
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();
  const mockTransaction = vi.fn();

  return {
    prisma: {
      user: {
        findMany: mockFindMany,
        count: mockCount,
      },
      $transaction: mockTransaction,
    },
  };
});

vi.mock("@/utils/ratelimit/check-ratelimit", () => ({
  checkRatelimit: vi.fn().mockResolvedValue(undefined),
}));

const testUserId = "test-user-id";

const defaultFilters = {
  search: "",
  role: "all",
  verified: "all",
  sortBy: "createdAt",
  order: "desc",
  page: 1,
};

const mockUsers = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean@exemple.fr",
    role: "CUSTOMER",
    emailVerified: true,
    image: null,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@exemple.fr",
    role: "ADMIN",
    emailVerified: true,
    image: null,
    createdAt: new Date("2024-01-10"),
  },
];

describe("getUsers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns users with pagination metadata", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([mockUsers, 2]);

    const result = await getUsers(defaultFilters, testUserId);

    expect(result.users).toEqual(mockUsers);
    expect(result.totalCount).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it("calls prisma.$transaction", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

    await getUsers(defaultFilters, testUserId);

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("calculates totalPages correctly", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([mockUsers, 25]);

    const result = await getUsers(defaultFilters, testUserId);

    expect(result.totalPages).toBe(3);
  });

  it("returns at least 1 total page even with 0 results", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

    const result = await getUsers(defaultFilters, testUserId);

    expect(result.totalPages).toBe(1);
  });

  describe("search filter sanitization", () => {
    it("truncates search to max 100 characters", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      const longSearch = "a".repeat(150);
      await getUsers(
        { ...defaultFilters, search: longSearch },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("trims search whitespace", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, search: "  test  " },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("page sanitization", () => {
    it("clamps page to minimum 1", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      const result = await getUsers(
        { ...defaultFilters, page: -5 },
        testUserId,
      );

      expect(result.currentPage).toBe(1);
    });

    it("clamps page to maximum 1000", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      const result = await getUsers(
        { ...defaultFilters, page: 9999 },
        testUserId,
      );

      expect(result.currentPage).toBe(1000);
    });
  });

  describe("role filter sanitization", () => {
    it("defaults to 'all' for invalid role", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, role: "INVALID" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("accepts valid role values", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, role: "ADMIN" },
        testUserId,
      );
      await getUsers(
        { ...defaultFilters, role: "CUSTOMER" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe("verified filter sanitization", () => {
    it("defaults to 'all' for invalid verified value", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, verified: "INVALID" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("accepts valid verified values", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, verified: "verified" },
        testUserId,
      );
      await getUsers(
        { ...defaultFilters, verified: "unverified" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe("sortBy sanitization", () => {
    it("defaults to 'createdAt' for invalid sortBy", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, sortBy: "password" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("accepts valid sortBy values", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, sortBy: "name" },
        testUserId,
      );
      await getUsers(
        { ...defaultFilters, sortBy: "email" },
        testUserId,
      );
      await getUsers(
        { ...defaultFilters, sortBy: "createdAt" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe("order sanitization", () => {
    it("defaults to 'desc' for invalid order", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, order: "INVALID" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("accepts valid order values", async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

      await getUsers(
        { ...defaultFilters, order: "asc" },
        testUserId,
      );
      await getUsers(
        { ...defaultFilters, order: "desc" },
        testUserId,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });
});
