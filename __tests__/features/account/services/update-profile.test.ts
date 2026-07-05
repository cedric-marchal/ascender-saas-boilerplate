import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ConflictError } from "@/utils/errors/errors";

// Create mocks
const mockPrismaFindUnique = vi.fn();
const mockAuthUpdateUser = vi.fn();
const mockAuthChangeEmail = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidateLocalizedPath = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      updateUser: mockAuthUpdateUser,
      changeEmail: mockAuthChangeEmail,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/i18n/revalidate-localized-path", () => ({
  revalidateLocalizedPath: mockRevalidateLocalizedPath,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_BASE_URL: "https://test.example.com",
  },
}));

// Import after mocks
const { updateProfile } =
  await import("@/features/account/services/update-profile.service");

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockAuthUpdateUser.mockResolvedValue(undefined);
    mockAuthChangeEmail.mockResolvedValue(undefined);
  });

  it("returns unchanged user if nothing changes", async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
      emailVerified: true,
    });

    const result = await updateProfile({
      userId: "user-123",
      name: "John Doe",
      email: "john@example.com",
    });

    expect(result.emailChanged).toBe(false);
    expect(result.user).toEqual({
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
      emailVerified: true,
    });
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
    expect(mockAuthChangeEmail).not.toHaveBeenCalled();
  });

  it("updates name only via auth.api.updateUser", async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: "user-123",
      name: "Old Name",
      email: "john@example.com",
      emailVerified: true,
    });

    const result = await updateProfile({
      userId: "user-123",
      name: "New Name",
      email: "john@example.com",
    });

    expect(mockAuthUpdateUser).toHaveBeenCalledWith({
      body: {
        name: "New Name",
      },
      headers: expect.any(Headers),
    });
    expect(mockRevalidateLocalizedPath).toHaveBeenCalledWith(
      "/dashboard/settings",
    );
    expect(result.emailChanged).toBe(false);
    expect(result.user.name).toBe("New Name");
  });

  it("changes email via auth.api.changeEmail", async () => {
    mockPrismaFindUnique
      .mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "old@example.com",
        emailVerified: true,
      })
      .mockResolvedValueOnce(null);

    const result = await updateProfile({
      userId: "user-123",
      name: "John Doe",
      email: "new@example.com",
    });

    expect(mockAuthChangeEmail).toHaveBeenCalledWith({
      body: {
        newEmail: "new@example.com",
        callbackURL: "https://test.example.com/dashboard/settings",
      },
      headers: expect.any(Headers),
    });
    expect(mockRevalidateLocalizedPath).toHaveBeenCalledWith(
      "/dashboard/settings",
    );
    expect(result.emailChanged).toBe(true);
    expect(result.user.email).toBe("old@example.com");
  });

  it("changes name and email together", async () => {
    mockPrismaFindUnique
      .mockResolvedValueOnce({
        id: "user-123",
        name: "Old Name",
        email: "old@example.com",
        emailVerified: true,
      })
      .mockResolvedValueOnce(null);

    const result = await updateProfile({
      userId: "user-123",
      name: "New Name",
      email: "new@example.com",
    });

    expect(mockAuthUpdateUser).toHaveBeenCalledWith({
      body: { name: "New Name" },
      headers: expect.any(Headers),
    });
    expect(mockAuthChangeEmail).toHaveBeenCalledWith({
      body: {
        newEmail: "new@example.com",
        callbackURL: "https://test.example.com/dashboard/settings",
      },
      headers: expect.any(Headers),
    });
    expect(result.emailChanged).toBe(true);
    expect(result.user.name).toBe("New Name");
  });

  it("throws BadRequestError if user not found", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    await expect(
      updateProfile({
        userId: "missing-user",
        name: "Test",
        email: "test@example.com",
      }),
    ).rejects.toThrow(BadRequestError);
    await expect(
      updateProfile({
        userId: "missing-user",
        name: "Test",
        email: "test@example.com",
      }),
    ).rejects.toThrow("errors.account.userNotFound");
  });

  it("throws ConflictError if email already used", async () => {
    mockPrismaFindUnique
      .mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "old@example.com",
        emailVerified: true,
      })
      .mockResolvedValueOnce({
        id: "other-user",
      });

    await expect(
      updateProfile({
        userId: "user-123",
        name: "John Doe",
        email: "taken@example.com",
      }),
    ).rejects.toThrow(ConflictError);

    // Reset mocks for second assertion
    mockPrismaFindUnique.mockClear();
    mockPrismaFindUnique
      .mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "old@example.com",
        emailVerified: true,
      })
      .mockResolvedValueOnce({
        id: "other-user",
      });

    await expect(
      updateProfile({
        userId: "user-123",
        name: "John Doe",
        email: "taken@example.com",
      }),
    ).rejects.toThrow("errors.account.emailAlreadyUsed");
  });

  it("returns emailChanged true when email changes", async () => {
    mockPrismaFindUnique
      .mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "old@example.com",
        emailVerified: true,
      })
      .mockResolvedValueOnce(null);

    const result = await updateProfile({
      userId: "user-123",
      name: "John Doe",
      email: "new@example.com",
    });

    expect(result.emailChanged).toBe(true);
  });

  it("returns emailChanged false when only name changes", async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: "user-123",
      name: "Old Name",
      email: "same@example.com",
      emailVerified: true,
    });

    const result = await updateProfile({
      userId: "user-123",
      name: "New Name",
      email: "same@example.com",
    });

    expect(result.emailChanged).toBe(false);
  });
});
