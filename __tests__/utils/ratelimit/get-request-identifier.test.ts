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

  it("returns first IP from x-forwarded-for", () => {
    const request = createMockRequest({
      "x-forwarded-for": "192.168.1.1, 10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("192.168.1.1");
  });

  it("trims IP from x-forwarded-for", () => {
    const request = createMockRequest({
      "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("192.168.1.1");
  });

  it("returns cf-connecting-ip when no x-forwarded-for", () => {
    const request = createMockRequest({
      "cf-connecting-ip": "172.16.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("172.16.0.1");
  });

  it("returns x-real-ip when no x-forwarded-for or cf-connecting-ip", () => {
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

  it("returns 'unknown' in production when no headers", () => {
    vi.stubEnv("NODE_ENV", "production");

    const request = createMockRequest({});
    expect(getRequestIdentifier(request)).toBe("unknown");
  });

  it("prefers x-forwarded-for over cf-connecting-ip and x-real-ip", () => {
    const request = createMockRequest({
      "x-forwarded-for": "192.168.1.1",
      "cf-connecting-ip": "172.16.0.1",
      "x-real-ip": "10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("192.168.1.1");
  });

  it("prefers cf-connecting-ip over x-real-ip", () => {
    const request = createMockRequest({
      "cf-connecting-ip": "172.16.0.1",
      "x-real-ip": "10.0.0.1",
    });
    expect(getRequestIdentifier(request)).toBe("172.16.0.1");
  });
});

describe("getActionIdentifier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns first IP from x-forwarded-for header", async () => {
    const mockHeaders = {
      get: (name: string) => {
        if (name === "x-forwarded-for") {
          return "192.168.1.1, 10.0.0.1";
        }
        return null;
      },
    };
    vi.mocked(headers).mockResolvedValue(mockHeaders as any);

    const result = await getActionIdentifier();
    expect(result).toBe("192.168.1.1");
  });

  it("returns cf-connecting-ip when no x-forwarded-for", async () => {
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

  it("returns x-real-ip as fallback", async () => {
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
