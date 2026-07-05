import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackEvent } from "@/lib/analytics";

describe("trackEvent", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("is a no-op in production (no console output)", () => {
    vi.stubEnv("NODE_ENV", "production");

    trackEvent("user_signed_up", { email: "user@example.com" });

    expect(console.log).not.toHaveBeenCalled();
  });

  it("logs via logger.debug in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    trackEvent("checkout_started", { organizationId: "org_1" });

    expect(console.log).toHaveBeenCalledTimes(1);
    const [, message, properties] = vi.mocked(console.log).mock.calls[0]!;
    expect(message).toBe("Analytics event: checkout_started");
    expect(properties).toEqual({ organizationId: "org_1" });
  });

  it("accepts every core funnel event without a type error", () => {
    vi.stubEnv("NODE_ENV", "development");

    trackEvent("user_signed_up");
    trackEvent("organization_created");
    trackEvent("checkout_started");
    trackEvent("subscription_activated");
    trackEvent("invitation_sent");
    trackEvent("project_created");

    expect(console.log).toHaveBeenCalledTimes(6);
  });

  it("works without a properties argument", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(() => trackEvent("project_created")).not.toThrow();
  });
});
