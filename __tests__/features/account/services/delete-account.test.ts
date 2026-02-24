import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ForbiddenError } from "@/utils/errors/errors";

// Create mocks
const mockPrismaUserFindUnique = vi.fn();
const mockPrismaUserCount = vi.fn();
const mockPrismaUserDelete = vi.fn();
const mockPrismaStripeCustomerFindUnique = vi.fn();
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
    stripeCustomer: {
      findUnique: mockPrismaStripeCustomerFindUnique,
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

vi.mock("@/lib/constants/roles.constant", () => ({
  UserRole: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
}));

// Import after mocks
const { deleteAccount } =
  await import("@/features/account/services/delete-account.service");

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("deletes user from DB", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

    await deleteAccount({
      userId: "user-123",
      userName: "John Doe",
      confirmation: "user@example.com",
    });

    expect(mockPrismaUserDelete).toHaveBeenCalledWith({
      where: { id: "user-123" },
    });
  });

  it("deletes Stripe customer if CUSTOMER role", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });
    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockStripeCustomersDel).toHaveBeenCalledWith("cus_123");
    expect(mockRedisDel).toHaveBeenCalledWith("subscription:user-123:pro");
    expect(mockRedisDel).toHaveBeenCalledWith("invoices:user-123");
  });

  it("does not delete Stripe if ADMIN", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "admin-123",
      email: "admin@example.com",
      image: null,
      role: "ADMIN",
    });
    mockPrismaUserCount.mockResolvedValue(2);

    await deleteAccount({
      userId: "admin-123",
      userName: "Admin",
      confirmation: "admin@example.com",
    });

    expect(mockPrismaStripeCustomerFindUnique).not.toHaveBeenCalled();
    expect(mockStripeCustomersDel).not.toHaveBeenCalled();
  });

  it("invalidates Redis cache", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: null,
      role: "CUSTOMER",
    });
    mockPrismaStripeCustomerFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_123",
    });

    await deleteAccount({
      userId: "user-123",
      userName: "John",
      confirmation: "user@example.com",
    });

    expect(mockRedisDel).toHaveBeenCalledWith("subscription:user-123:pro");
    expect(mockRedisDel).toHaveBeenCalledWith("invoices:user-123");
  });

  it("deletes avatar if present", async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      image: "avatars/user-123.webp",
      role: "CUSTOMER",
    });
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

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
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

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
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

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
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);

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
    mockPrismaStripeCustomerFindUnique.mockResolvedValue(null);
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
