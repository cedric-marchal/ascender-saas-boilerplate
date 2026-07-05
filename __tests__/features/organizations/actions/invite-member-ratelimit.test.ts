import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooManyRequestsError } from "@/utils/errors/errors";

// ---------------------------------------------------------------------------
// Mock dependencies BEFORE importing the action
// ---------------------------------------------------------------------------

const mockCheckRatelimit = vi.fn();
const mockHeaders = vi.fn();
const mockGetSession = vi.fn();
const mockCreateInvitation = vi.fn();
const mockMemberFindFirst = vi.fn();
const mockCheckSeatCapacity = vi.fn();
const mockLogEvent = vi.fn();

vi.mock("@/utils/ratelimit/check-ratelimit", () => ({
  checkRatelimit: mockCheckRatelimit,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      createInvitation: mockCreateInvitation,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findFirst: mockMemberFindFirst,
    },
  },
}));

vi.mock("@/lib/ratelimit", () => ({
  invitationRatelimit: { limit: "invitation" },
}));

vi.mock(
  "@/features/organizations/services/check-seat-capacity.service",
  () => ({
    checkSeatCapacity: mockCheckSeatCapacity,
  }),
);

vi.mock("@/features/organizations/services/audit-log.service", () => ({
  logEvent: mockLogEvent,
}));

// Import action AFTER mocks
const { inviteMemberAction } =
  await import("@/features/organizations/actions/invite-member.action");

const THROTTLE_MESSAGE = "Trop de requêtes. Veuillez réessayer plus tard.";
const USER_ID = "user-owner-1";
const ORGANIZATION_ID = "org-1";

describe("inviteMemberAction rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({
      user: {
        id: USER_ID,
        email: "owner@example.com",
        name: "Owner",
        role: "CUSTOMER",
      },
      activeOrganizationId: ORGANIZATION_ID,
    });
    mockMemberFindFirst.mockResolvedValue({ role: "owner" });
    mockCheckSeatCapacity.mockResolvedValue(undefined);
    mockCreateInvitation.mockResolvedValue(undefined);
    mockLogEvent.mockResolvedValue(undefined);
  });

  it("caps invitation spam by rejecting once the limit is exceeded", async () => {
    mockCheckRatelimit.mockRejectedValue(
      new TooManyRequestsError(THROTTLE_MESSAGE),
    );

    const result = await inviteMemberAction({
      email: "invitee@example.com",
      role: "member",
    });

    expect(result?.serverError).toBe(THROTTLE_MESSAGE);
    expect(mockCreateInvitation).not.toHaveBeenCalled();
    expect(mockCheckSeatCapacity).not.toHaveBeenCalled();
  });

  it("keys the ratelimit check by userId", async () => {
    mockCheckRatelimit.mockResolvedValue(undefined);

    await inviteMemberAction({
      email: "invitee@example.com",
      role: "member",
    });

    expect(mockCheckRatelimit).toHaveBeenCalledWith(
      { limit: "invitation" },
      USER_ID,
    );
  });

  it("allows the happy path when rate limit is not exceeded", async () => {
    mockCheckRatelimit.mockResolvedValue(undefined);

    const result = await inviteMemberAction({
      email: "invitee@example.com",
      role: "member",
    });

    expect(result?.data?.success).toBe(true);
    expect(mockCreateInvitation).toHaveBeenCalled();
  });
});
