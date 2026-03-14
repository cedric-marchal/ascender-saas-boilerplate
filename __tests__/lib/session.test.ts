import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();
const mockGetSessionAuth = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

vi.mock("react", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    cache: (fn: unknown) => fn,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    $Infer: { Session: {} },
    api: {
      getSession: mockGetSessionAuth,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findFirst: mockSubscriptionFindFirst,
    },
  },
}));

vi.mock("@/features/billing/constants/subscription-status.constant", () => ({
  ACTIVE_SUBSCRIPTION_STATUSES: ["ACTIVE", "TRIALING", "PAST_DUE"],
}));

const {
  getSession,
  requireSession,
  requireCustomer,
  requireCustomerVerifiedEmail,
  requireAdmin,
  requireAdminVerifiedEmail,
  requireCustomerProSubscription,
} = await import("@/lib/session");

const makeSession = (
  overrides: {
    role?: string;
    emailVerified?: boolean;
    id?: string;
  } = {},
) => ({
  user: {
    id: overrides.id ?? "user-123",
    email: "user@example.com",
    name: "Test User",
    role: overrides.role ?? "CUSTOMER",
    emailVerified: overrides.emailVerified ?? true,
  },
  session: { id: "session-123", expiresAt: new Date() },
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if no session exists", async () => {
    mockGetSessionAuth.mockResolvedValue(null);

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("returns session with parsed role", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "ADMIN" }));

    const result = await getSession();

    expect(result?.user.role).toBe("ADMIN");
  });

  it("throws if role is invalid", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "UNKNOWN_ROLE" }));

    await expect(getSession()).rejects.toThrow(
      "Role invalide dans la session: UNKNOWN_ROLE",
    );
  });
});

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /connexion if no session", async () => {
    mockGetSessionAuth.mockResolvedValue(null);

    await requireSession();

    expect(mockRedirect).toHaveBeenCalledWith("/connexion");
  });

  it("returns session if authenticated", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession());

    const result = await requireSession();

    expect(result?.user.id).toBe("user-123");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("requireCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound if user is ADMIN", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "ADMIN" }));

    await requireCustomer();

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("returns session if user is CUSTOMER", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "CUSTOMER" }));

    const result = await requireCustomer();

    expect(result?.user.role).toBe("CUSTOMER");
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

describe("requireCustomerVerifiedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /dashboard/parametres if email not verified", async () => {
    mockGetSessionAuth.mockResolvedValue(
      makeSession({ role: "CUSTOMER", emailVerified: false }),
    );

    await requireCustomerVerifiedEmail();

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard/parametres");
  });

  it("returns session if email is verified", async () => {
    mockGetSessionAuth.mockResolvedValue(
      makeSession({ role: "CUSTOMER", emailVerified: true }),
    );

    const result = await requireCustomerVerifiedEmail();

    expect(result?.user.emailVerified).toBe(true);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound if user is CUSTOMER", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "CUSTOMER" }));

    await requireAdmin();

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("returns session if user is ADMIN", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "ADMIN" }));

    const result = await requireAdmin();

    expect(result?.user.role).toBe("ADMIN");
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

describe("requireAdminVerifiedEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /admin/parametres if admin email not verified", async () => {
    mockGetSessionAuth.mockResolvedValue(
      makeSession({ role: "ADMIN", emailVerified: false }),
    );

    await requireAdminVerifiedEmail();

    expect(mockRedirect).toHaveBeenCalledWith("/admin/parametres");
  });

  it("returns session if admin email is verified", async () => {
    mockGetSessionAuth.mockResolvedValue(
      makeSession({ role: "ADMIN", emailVerified: true }),
    );

    const result = await requireAdminVerifiedEmail();

    expect(result?.user.emailVerified).toBe(true);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("requireCustomerProSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /tarifs if no active subscription", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "CUSTOMER" }));
    mockSubscriptionFindFirst.mockResolvedValue(null);

    await requireCustomerProSubscription();

    expect(mockRedirect).toHaveBeenCalledWith("/tarifs");
  });

  it("returns session if active subscription exists", async () => {
    mockGetSessionAuth.mockResolvedValue(makeSession({ role: "CUSTOMER" }));
    mockSubscriptionFindFirst.mockResolvedValue({ id: "sub-123" });

    const result = await requireCustomerProSubscription();

    expect(result?.user.role).toBe("CUSTOMER");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
