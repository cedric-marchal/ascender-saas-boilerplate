import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ForbiddenError } from "@/utils/errors/errors";

// Create mocks
const mockPrismaUserFindUnique = vi.fn();
const mockPrismaUserCount = vi.fn();
const mockPrismaUserDelete = vi.fn();
const mockPrismaOrganizationFindMany = vi.fn();
const mockStripeCustomersDel = vi.fn();
const mockRedisDel = vi.fn();
const mockDeleteFile = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaUserFindUnique,
      count: mockPrismaUserCount,
      delete: mockPrismaUserDelete,
    },
    organization: {
      findMany: mockPrismaOrganizationFindMany,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: {
      del: mockStripeCustomersDel,
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    del: mockRedisDel,
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteFile: mockDeleteFile,
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_NAME: "TestApp",
    RESEND_EMAIL_NOREPLY: "noreply@test.com",
  },
}));

// Import after mocks
const { deleteAccount } =
  await import("@/features/account/services/delete-account.service");

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
    mockPrismaOrganizationFindMany.mockResolvedValue([]);
  });

  it("deletes user from DB", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John Doe",
      confirmation: "user@example.com",
    });

    expect(mockPrismaUserDelete).toHaveBeenCalledWith({
      where: { id: "user-123" },
    });
  });

  it("deletes Stripe customer for owned organization", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    mockPrismaOrganizationFindMany.mockResolvedValue([
      {
        id: "org-123",
        stripeCustomer: { stripeCustomerId: "cus_123" },
        members: [{ id: "member-1" }],
      },
    ]);

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockStripeCustomersDel).toHaveBeenCalledWith("cus_123");
  });

  it("invalidates Redis cache for owned organization", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    mockPrismaOrganizationFindMany.mockResolvedValue([
      {
        id: "org-123",
        stripeCustomer: { stripeCustomerId: "cus_123" },
        members: [{ id: "member-1" }],
      },
    ]);

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockRedisDel).toHaveBeenCalledWith("subscriptions:org:org-123");
    expect(mockRedisDel).toHaveBeenCalledWith("invoices:org:org-123");
  });

  it("does not delete Stripe if no owned orgs with stripe customer", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "admin-123",
      email: "admin@example.com",
      image: null,
      role: "ADMIN",
    });
    mockPrismaUserCount.mockResolvedValue(2);
    mockPrismaOrganizationFindMany.mockResolvedValue([]);

    await deleteAccount({
      userId: "admin-123",
      userName: "Admin",
      confirmation: "admin@example.com",
    });

    expect(mockStripeCustomersDel).not.toHaveBeenCalled();
  });

  it("deletes avatar if present", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: "avatars/user-123.webp",
      role: "CUSTOMER",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockDeleteFile).toHaveBeenCalledWith("avatars/user-123.webp");
  });

  it("does not delete avatar if image is null", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("does not delete avatar if not in avatars folder", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: "other/path.jpg",
      role: "CUSTOMER",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("sends confirmation email", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John Doe",
      confirmation: "user@example.com",
    });

    expect(mockSendEmail).toHaveBeenCalledWith({
      from: "TestApp <noreply@test.com>",
      to: "user@example.com",
      subject: "Votre compte TestApp a été supprimé",
      react: expect.anything(),
    });
  });

  it("does not crash if email fails", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });
    mockSendEmail.mockRejectedValue(new Error("Email failed"));

    await expect(
      deleteAccount({
        userId: "user-123",
        userName: "John",
        confirmation: "user@example.com",
      }),
    ).resolves.not.toThrow();
  });

  it("throws BadRequestError if user not found", async () => {
    mockPrismaUserFindUnique.mockResolvedValue(null);

    await expect(
      deleteAccount({
        userId: "missing-user",
        userName: "Test",
        confirmation: "test@example.com",
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      deleteAccount({
        userId: "missing-user",
        userName: "Test",
        confirmation: "test@example.com",
      }),
    ).rejects.toThrow("Utilisateur introuvable");
  });

  it("throws BadRequestError if confirmation does not match email", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });

    await expect(
      deleteAccount({
        userId: "user-123",
        userName: "John",
        confirmation: "wrong@example.com",
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      deleteAccount({
        userId: "user-123",
        userName: "John",
        confirmation: "wrong@example.com",
      }),
    ).rejects.toThrow("email de confirmation ne correspond pas");
  });

  it("throws ForbiddenError if last admin", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "admin-123",
      email: "admin@example.com",
      image: null,
      role: "ADMIN",
    });
    mockPrismaUserCount.mockResolvedValue(1);

    await expect(
      deleteAccount({
        userId: "admin-123",
        userName: "Admin",
        confirmation: "admin@example.com",
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      deleteAccount({
        userId: "admin-123",
        userName: "Admin",
        confirmation: "admin@example.com",
      }),
    ).rejects.toThrow("seul administrateur");
  });
});
