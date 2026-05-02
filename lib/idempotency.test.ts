import { describe, expect, it } from "vitest";

import { normalizeIdempotencyKey } from "@/lib/idempotency";

describe("normalizeIdempotencyKey", () => {
  it("returns null for missing values", () => {
    expect(normalizeIdempotencyKey(undefined)).toBeNull();
    expect(normalizeIdempotencyKey(null)).toBeNull();
    expect(normalizeIdempotencyKey("")).toBeNull();
  });

  it("returns null for short keys", () => {
    expect(normalizeIdempotencyKey("short")).toBeNull();
  });

  it("trims and preserves valid keys", () => {
    expect(normalizeIdempotencyKey("  valid-idempotency-key  ")).toBe("valid-idempotency-key");
  });

  it("caps key length at 200 chars", () => {
    const longKey = "x".repeat(250);
    expect(normalizeIdempotencyKey(longKey)).toHaveLength(200);
  });
});
