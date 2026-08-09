import { describe, it, expect, afterAll } from "vitest";
import { NextRequest } from "next/server";

const originalTrustProxy = process.env.TRUST_PROXY_HEADERS;

afterAll(() => {
  if (originalTrustProxy === undefined) {
    delete process.env.TRUST_PROXY_HEADERS;
  } else {
    process.env.TRUST_PROXY_HEADERS = originalTrustProxy;
  }
});

function makeRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://via-antiqua.maestro7it.ru/api/auth/login", {
    headers,
  });
}

describe("getClientIp", () => {
  it("ignores proxy headers when TRUST_PROXY_HEADERS is not set", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const { getClientIp } = await import("../get-ip");
    const req = makeRequest({
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });
    expect(getClientIp(req)).toBe("unknown");
  });

  it("returns X-Real-IP when proxy headers are trusted", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const { getClientIp } = await import("../get-ip");
    const req = makeRequest({
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("uses the last X-Forwarded-For entry when trusted and X-Real-IP absent", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const { getClientIp } = await import("../get-ip");
    const req = makeRequest({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("returns 'unknown' when trusted but no proxy headers present", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const { getClientIp } = await import("../get-ip");
    expect(getClientIp(makeRequest({}))).toBe("unknown");
  });
});

describe("normalizeIp", () => {
  it("converts IPv4-mapped IPv6 to plain IPv4", async () => {
    const { normalizeIp } = await import("../get-ip");
    expect(normalizeIp("::ffff:192.168.1.1")).toBe("192.168.1.1");
  });

  it("returns bare IPv6 addresses unchanged", async () => {
    const { normalizeIp } = await import("../get-ip");
    expect(normalizeIp("2001:db8::1")).toBe("2001:db8::1");
  });

  it("trims whitespace and caps length", async () => {
    const { normalizeIp } = await import("../get-ip");
    expect(normalizeIp("  10.0.0.1  ")).toBe("10.0.0.1");
    expect(normalizeIp("a".repeat(200))).toBe("a".repeat(64));
  });
});