import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();

vi.mock("react", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    cache: (fn: unknown) => fn,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}));

const { getPricingUserStatus } =
  await import("@/features/pricing/services/get-pricing-user-status.service");

describe("getPricingUserStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all false when userId is null", async () => {
    const result = await getPricingUserStatus(null);

    expect(result).toEqual({
      isAuthenticated: false,
      isEmailVerified: false,
      isCustomer: false,
    });
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns all true for a verified CUSTOMER", async () => {
    mockUserFindUnique.mockResolvedValue({
      emailVerified: true,
      role: "CUSTOMER",
    });

    const result = await getPricingUserStatus("user-123");

    expect(result).toEqual({
      isAuthenticated: true,
      isEmailVerified: true,
      isCustomer: true,
    });
  });

  it("returns isCustomer false for ADMIN", async () => {
    mockUserFindUnique.mockResolvedValue({
      emailVerified: true,
      role: "ADMIN",
    });

    const result = await getPricingUserStatus("admin-456");

    expect(result).toEqual({
      isAuthenticated: true,
      isEmailVerified: true,
      isCustomer: false,
    });
  });

  it("returns isEmailVerified false for unverified CUSTOMER", async () => {
    mockUserFindUnique.mockResolvedValue({
      emailVerified: false,
      role: "CUSTOMER",
    });

    const result = await getPricingUserStatus("user-789");

    expect(result).toEqual({
      isAuthenticated: true,
      isEmailVerified: false,
      isCustomer: true,
    });
  });

  it("returns isAuthenticated true but others false when user not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getPricingUserStatus("unknown-user");

    expect(result).toEqual({
      isAuthenticated: true,
      isEmailVerified: false,
      isCustomer: false,
    });
  });

  it("queries user with correct id", async () => {
    mockUserFindUnique.mockResolvedValue({
      emailVerified: true,
      role: "CUSTOMER",
    });

    await getPricingUserStatus("specific-user-id");

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "specific-user-id" },
      select: { emailVerified: true, role: true },
    });
  });
});
