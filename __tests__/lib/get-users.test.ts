import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getUsers,
  type GetUsersFilters,
} from "@/features/users/services/get-users.service";

import { DEFAULT_PAGE_SIZE } from "@/lib/parsers/nuqs";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi
      .fn()
      .mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
  },
}));

const defaultFilters: GetUsersFilters = {
  search: "",
  role: "all",
  verified: "all",
  sortBy: "createdAt",
  order: "desc",
  page: 1,
};

const mockDate = new Date("2024-01-15");

const mockUsers = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean@exemple.fr",
    role: "CUSTOMER" as const,
    emailVerified: true,
    image: null,
    slug: "jean-dupont",
    createdAt: mockDate,
    updatedAt: mockDate,
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@exemple.fr",
    role: "ADMIN" as const,
    emailVerified: true,
    image: null,
    slug: "admin-user",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
];

describe("getUsers", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns users with pagination metadata", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);
    vi.mocked(prisma.user.count).mockResolvedValue(2);

    const result = await getUsers(defaultFilters);

    expect(result.users).toEqual(mockUsers);
    expect(result.totalCount).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });

  it("uses $transaction for parallel queries", async () => {
    await getUsers(defaultFilters);

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  describe("pagination", () => {
    it("calculates totalPages correctly", async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(25);

      const result = await getUsers(defaultFilters);

      expect(result.totalPages).toBe(3);
    });

    it("returns at least 1 total page when 0 results", async () => {
      const result = await getUsers(defaultFilters);

      expect(result.totalPages).toBe(1);
    });

    it("reflects currentPage from filters", async () => {
      const result = await getUsers({ ...defaultFilters, page: 5 });

      expect(result.currentPage).toBe(5);
    });

    it("applies correct skip for page 3", async () => {
      await getUsers({ ...defaultFilters, page: 3 });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.skip).toBe(2 * DEFAULT_PAGE_SIZE);
    });

    it("limits results to DEFAULT_PAGE_SIZE", async () => {
      await getUsers(defaultFilters);

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.take).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe("search filter", () => {
    it("applies OR clause on name and email when search is provided", async () => {
      await getUsers({ ...defaultFilters, search: "dupont" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).toMatchObject({
        OR: [
          { name: { contains: "dupont", mode: "insensitive" } },
          { email: { contains: "dupont", mode: "insensitive" } },
        ],
      });
    });

    it("omits OR clause when search is empty", async () => {
      await getUsers({ ...defaultFilters, search: "" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).not.toHaveProperty("OR");
    });
  });

  describe("role filter", () => {
    it("applies role ADMIN to where clause", async () => {
      await getUsers({ ...defaultFilters, role: "ADMIN" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).toMatchObject({ role: "ADMIN" });
    });

    it("applies role CUSTOMER to where clause", async () => {
      await getUsers({ ...defaultFilters, role: "CUSTOMER" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).toMatchObject({ role: "CUSTOMER" });
    });

    it("omits role filter when role is 'all'", async () => {
      await getUsers({ ...defaultFilters, role: "all" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).not.toHaveProperty("role");
    });
  });

  describe("verified filter", () => {
    it("filters emailVerified: true when verified is 'verified'", async () => {
      await getUsers({ ...defaultFilters, verified: "verified" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).toMatchObject({ emailVerified: true });
    });

    it("filters emailVerified: false when verified is 'unverified'", async () => {
      await getUsers({ ...defaultFilters, verified: "unverified" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).toMatchObject({ emailVerified: false });
    });

    it("omits emailVerified filter when verified is 'all'", async () => {
      await getUsers({ ...defaultFilters, verified: "all" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.where).not.toHaveProperty("emailVerified");
    });
  });

  describe("sort and order", () => {
    it("applies name field ascending", async () => {
      await getUsers({ ...defaultFilters, sortBy: "name", order: "asc" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.orderBy).toEqual({ name: "asc" });
    });

    it("applies email field descending", async () => {
      await getUsers({ ...defaultFilters, sortBy: "email", order: "desc" });

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.orderBy).toEqual({ email: "desc" });
    });

    it("applies createdAt field descending by default", async () => {
      await getUsers(defaultFilters);

      const findManyArgs = vi.mocked(prisma.user.findMany).mock.calls[0]![0]!;
      expect(findManyArgs.orderBy).toEqual({ createdAt: "desc" });
    });
  });
});
