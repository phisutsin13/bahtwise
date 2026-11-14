import { afterEach, describe, expect, it, vi } from "vitest";
import { debugError, debugLog, sanitizeForLog } from "@/lib/logger";

describe("sanitizeForLog", () => {
  it("redacts emails, UUIDs and long identifiers inside strings", () => {
    const result = sanitizeForLog(
      "user somchai@example.com id 3f2504e0-4f89-11d3-9a0c-0305e82c3301 amount 1234567890",
    );
    expect(result).toBe(
      "user [email] id [uuid] amount [number]",
    );
  });

  it("redacts sensitive object keys recursively", () => {
    const result = sanitizeForLog({
      email: "a@b.co",
      password: "hunter2",
      note: "rent",
      nested: { userId: "123", amountSatang: 5000, kind: "expense" },
    });
    expect(result).toEqual({
      email: "[redacted]",
      password: "[redacted]",
      note: "[redacted]",
      nested: {
        userId: "[redacted]",
        amountSatang: "[redacted]",
        kind: "expense",
      },
    });
  });

  it("truncates long strings and limits depth", () => {
    const long = "x".repeat(400);
    expect(String(sanitizeForLog(long))).toHaveLength(300);

    const deep = { a: { b: { c: { d: { e: { f: "secret" } } } } } };
    expect(JSON.stringify(sanitizeForLog(deep))).toContain("[depth]");
  });

  it("leaves safe primitives alone", () => {
    expect(sanitizeForLog(42)).toBe(42);
    expect(sanitizeForLog(true)).toBe(true);
    expect(sanitizeForLog(null)).toBeNull();
    expect(sanitizeForLog(undefined)).toBeUndefined();
    expect(sanitizeForLog(Number.NaN)).toBe(0);
  });
});

describe("debug logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is silent outside development", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    debugLog("test.event", { email: "a@b.co", count: 2 });
    debugError("test.error", new Error("boom"));
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("writes sanitized payloads in development", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    debugLog("test.event", { email: "a@b.co", note: "secret", count: 2 });
    expect(spy).toHaveBeenCalledWith("[my-money] test.event", {
      email: "[redacted]",
      note: "[redacted]",
      count: 2,
    });

    debugError("test.error", new Error("boom"));
    expect(spy).toHaveBeenCalledWith("[my-money] test.error", {
      errorName: "Error",
      code: undefined,
    });
    vi.unstubAllEnvs();
  });
});
