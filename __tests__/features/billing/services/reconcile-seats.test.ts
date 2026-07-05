import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrismaMemberCount = vi.fn();
const mockPrismaSubscriptionFindFirst = vi.fn();
const mockPrismaOrganizationFindUnique = vi.fn();
const mockPrismaMemberFindFirst = vi.fn();
const mockPrismaMemberDeleteMany = vi.fn();
const mockPrismaMemberUpdate = vi.fn();
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockSendSeatLimitExceededEmail = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: mockLoggerError,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      count: mockPrismaMemberCount,
      findFirst: mockPrismaMemberFindFirst,
      deleteMany: mockPrismaMemberDeleteMany,
      update: mockPrismaMemberUpdate,
    },
    subscription: {
      findFirst: mockPrismaSubscriptionFindFirst,
    },
    organization: {
      findUnique: mockPrismaOrganizationFindUnique,
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_PRICE_ID_PRO: "price_pro_test",
    NEXT_PUBLIC_APP_NAME: "Next SaaS Boilerplate",
    NEXT_PUBLIC_BASE_URL: "https://example.test",
  },
}));

vi.mock(
  "@/features/billing/services/send-seat-limit-exceeded-email.service",
  () => ({
    sendSeatLimitExceededEmail: mockSendSeatLimitExceededEmail,
  }),
);

const { reconcileSeatsOnDowngrade } =
  await import("@/features/billing/services/reconcile-seats.service");

const ORG_ID = "org-reconcile-1";
const FREE_PLAN_CAP = 1;
const PRO_PLAN_CAP = 5;
const PRO_PRICE_ID = "price_pro_test";

describe("reconcileSeatsOnDowngrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue("OK");
    mockPrismaOrganizationFindUnique.mockResolvedValue({ name: "Acme Inc." });
    mockPrismaMemberFindFirst.mockResolvedValue({
      user: { email: "owner@acme.test" },
    });
    mockSendSeatLimitExceededEmail.mockResolvedValue(undefined);
  });

  describe("over cap", () => {
    it("sends the seat-limit-exceeded email once for a 5-member org downgraded to free (cap 1)", async () => {
      mockPrismaMemberCount.mockResolvedValue(5);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockPrismaMemberFindFirst).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, role: "owner" },
        select: { user: { select: { email: true } } },
      });
      expect(mockSendSeatLimitExceededEmail).toHaveBeenCalledWith({
        email: "owner@acme.test",
        organizationName: "Acme Inc.",
        memberCount: 5,
        seatCap: FREE_PLAN_CAP,
        locale: "en",
      });
      expect(mockRedisSet).toHaveBeenCalledWith(
        `stripe:seat-limit-exceeded-email:${ORG_ID}:${FREE_PLAN_CAP}`,
        1,
        { ex: 60 * 60 * 24 * 30 },
      );
    });

    it("sends nothing on a second call for the same org + cap (dedupe)", async () => {
      mockPrismaMemberCount.mockResolvedValue(5);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);
      mockRedisGet.mockResolvedValue("1");

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).not.toHaveBeenCalled();
    });

    it("sends again when the cap changes further (different dedupe key)", async () => {
      mockPrismaMemberCount.mockResolvedValue(7);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);
      // Dedupe key for a previous, larger cap (e.g. Pro, 5) was already set,
      // but this org is now over the free cap (1) — a distinct key.
      mockRedisGet.mockImplementation(async (key: string) => {
        if (
          key === `stripe:seat-limit-exceeded-email:${ORG_ID}:${PRO_PLAN_CAP}`
        ) {
          return "1";
        }

        return null;
      });

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).toHaveBeenCalledWith(
        expect.objectContaining({ seatCap: FREE_PLAN_CAP, memberCount: 7 }),
      );
    });

    it("detects over-cap for a Pro org over its 5-seat cap", async () => {
      mockPrismaMemberCount.mockResolvedValue(6);
      mockPrismaSubscriptionFindFirst.mockResolvedValue({
        stripePriceId: PRO_PRICE_ID,
      });

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).toHaveBeenCalledWith(
        expect.objectContaining({ seatCap: PRO_PLAN_CAP, memberCount: 6 }),
      );
    });

    it("warns and sends nothing when no owner can be resolved", async () => {
      mockPrismaMemberCount.mockResolvedValue(5);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);
      mockPrismaMemberFindFirst.mockResolvedValue(null);

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        "Cannot send seat-limit-exceeded email: missing organization or owner",
        expect.objectContaining({ organizationId: ORG_ID }),
      );
    });
  });

  describe("under cap", () => {
    it("does nothing when the org is exactly at its cap", async () => {
      mockPrismaMemberCount.mockResolvedValue(FREE_PLAN_CAP);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).not.toHaveBeenCalled();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it("does nothing when the org is under its cap", async () => {
      mockPrismaMemberCount.mockResolvedValue(2);
      mockPrismaSubscriptionFindFirst.mockResolvedValue({
        stripePriceId: PRO_PRICE_ID,
      });

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).not.toHaveBeenCalled();
    });
  });

  describe("never mutates membership rows", () => {
    it("never calls member.deleteMany or member.update, even when far over cap", async () => {
      mockPrismaMemberCount.mockResolvedValue(20);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockPrismaMemberDeleteMany).not.toHaveBeenCalled();
      expect(mockPrismaMemberUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Redis unavailability", () => {
    it("still sends the email when the dedupe check fails (fail open)", async () => {
      mockPrismaMemberCount.mockResolvedValue(5);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);
      mockRedisGet.mockRejectedValue(new Error("Redis unavailable"));

      await reconcileSeatsOnDowngrade(ORG_ID);

      expect(mockSendSeatLimitExceededEmail).toHaveBeenCalled();
    });

    it("does not throw when the dedupe set fails after a successful send", async () => {
      mockPrismaMemberCount.mockResolvedValue(5);
      mockPrismaSubscriptionFindFirst.mockResolvedValue(null);
      mockRedisSet.mockRejectedValue(new Error("Redis unavailable"));

      await expect(reconcileSeatsOnDowngrade(ORG_ID)).resolves.toBeUndefined();

      expect(mockSendSeatLimitExceededEmail).toHaveBeenCalled();
    });
  });
});
