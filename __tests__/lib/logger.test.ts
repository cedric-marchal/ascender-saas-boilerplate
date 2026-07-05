import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("development transport (pretty)", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "development");
    });

    it("logs debug messages via console.log", () => {
      logger.debug("Debug message");

      expect(console.log).toHaveBeenCalledTimes(1);
      const [prefix, message] = vi.mocked(console.log).mock.calls[0]!;
      expect(prefix).toContain("[DEBUG]");
      expect(message).toBe("Debug message");
    });

    it("logs info messages via console.log", () => {
      logger.info("Info message");

      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it("logs warn messages via console.warn with context", () => {
      logger.warn("Warn message", { organizationId: "org_1" });

      expect(console.warn).toHaveBeenCalledTimes(1);
      const [prefix, message, context] = vi.mocked(console.warn).mock.calls[0]!;
      expect(prefix).toContain("[WARN]");
      expect(message).toBe("Warn message");
      expect(context).toEqual({ organizationId: "org_1" });
    });

    it("logs error messages via console.error with context", () => {
      logger.error("Error message", { userId: "user_1" });

      expect(console.error).toHaveBeenCalledTimes(1);
      const [prefix, message, context] = vi.mocked(console.error).mock
        .calls[0]!;
      expect(prefix).toContain("[ERROR]");
      expect(message).toBe("Error message");
      expect(context).toEqual({ userId: "user_1" });
    });

    it("omits the context argument entirely when none is passed", () => {
      logger.info("No context message");

      expect(vi.mocked(console.log).mock.calls[0]).toHaveLength(2);
    });
  });

  describe("production transport (JSON)", () => {
    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
    });

    it("logs a single-line JSON entry with timestamp, level, message and context", () => {
      logger.error("Something failed", { organizationId: "org_1" });

      expect(console.error).toHaveBeenCalledTimes(1);
      const [serialized] = vi.mocked(console.error).mock.calls[0]!;

      expect(typeof serialized).toBe("string");
      const parsed = JSON.parse(serialized as string) as Record<
        string,
        unknown
      >;

      expect(parsed.level).toBe("error");
      expect(parsed.message).toBe("Something failed");
      expect(parsed.organizationId).toBe("org_1");
      expect(typeof parsed.timestamp).toBe("string");
    });

    it("routes debug level through console.log even in production", () => {
      logger.debug("Debug in prod");

      expect(console.log).toHaveBeenCalledTimes(1);
      const [serialized] = vi.mocked(console.log).mock.calls[0]!;
      const parsed = JSON.parse(serialized as string) as Record<
        string,
        unknown
      >;
      expect(parsed.level).toBe("debug");
    });

    it("produces a JSON entry with no extra keys when context is omitted", () => {
      logger.warn("No context in prod");

      const [serialized] = vi.mocked(console.warn).mock.calls[0]!;
      const parsed = JSON.parse(serialized as string) as Record<
        string,
        unknown
      >;

      expect(Object.keys(parsed).sort()).toEqual(
        ["timestamp", "level", "message"].sort(),
      );
    });
  });
});
