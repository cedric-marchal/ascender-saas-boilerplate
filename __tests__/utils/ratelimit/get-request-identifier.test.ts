import { headers } from "next/headers";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getActionIdentifier,
  getRequestIdentifier,
} from "@/utils/ratelimit/get-request-identifier";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

function createMockRequest(headerMap: Record<string, string>): Request {
  return {
    headers: {
      get: (name: string) => headerMap[name] ?? null,
    },
  } as unknown as Request;
}

describe("getRequestIdentifier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns first IP from x-forwarded-for (original client)", () => {
    const request = createMockRequest({
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("1.2.3.4");
  });

  it("trims first IP from x-forwarded-for", () => {
    const request = createMockRequest({
      "x-forwarded-for": "  1.2.3.4  ,  10.0.0.1  ",
    });
    expect(getRequestIdentifier(request)).toBe("1.2.3.4");
  });

  it("returns cf-connecting-ip when present", () => {
    const request = createMockRequest({
      "cf-connecting-ip": "172.16.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("172.16.0.1");
  });

  it("returns x-real-ip when no cf-connecting-ip", () => {
    const request = createMockRequest({
      "x-real-ip": "10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("10.0.0.1");
  });

  it("returns 'dev-localhost' in development when no headers", () => {
    vi.stubEnv("NODE_ENV", "development");

    const request = createMockRequest({});
    expect(getRequestIdentifier(request)).toBe("dev-localhost");
  });

  it("throws in production when no headers", () => {
    vi.stubEnv("NODE_ENV", "production");

    const request = createMockRequest({});
    expect(() => getRequestIdentifier(request)).toThrow(
      "Unable to determine client IP",
    );
  });

  it("prefers cf-connecting-ip over x-real-ip and x-forwarded-for", () => {
    const request = createMockRequest({
      "cf-connecting-ip": "172.16.0.1",
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getRequestIdentifier(request)).toBe("172.16.0.1");
  });

  it("prefers x-real-ip over x-forwarded-for", () => {
    const request = createMockRequest({
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getRequestIdentifier(request)).toBe("10.0.0.1");
  });
});

describe("getActionIdentifier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns first IP from x-forwarded-for header (original client)", async () => {
    const mockHeaders = {
      get: (name: string) => {
        if (name === "x-forwarded-for") {
          return "1.2.3.4, 10.0.0.1";
        }
        return null;
      },
    };
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const result = await getActionIdentifier();
    expect(result).toBe("1.2.3.4");
  });

  it("returns cf-connecting-ip when present", async () => {
    const mockHeaders = {
      get: (name: string) => {
        if (name === "cf-connecting-ip") {
          return "172.16.0.1";
        }
        return null;
      },
    };
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const result = await getActionIdentifier();
    expect(result).toBe("172.16.0.1");
  });

  it("returns x-real-ip as fallback before x-forwarded-for", async () => {
    const mockHeaders = {
      get: (name: string) => {
        if (name === "x-real-ip") {
          return "10.0.0.1";
        }
        return null;
      },
    };
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const result = await getActionIdentifier();
    expect(result).toBe("10.0.0.1");
  });

  it("returns 'dev-localhost' in development when no headers", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const mockHeaders = {
      get: () => null,
    };
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const result = await getActionIdentifier();
    expect(result).toBe("dev-localhost");
  });
});
