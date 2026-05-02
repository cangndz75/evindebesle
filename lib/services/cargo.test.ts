import { describe, expect, it } from "vitest";

import { canTransitionToCompletedFrom } from "@/lib/services/cargo-state";

describe("canTransitionToCompletedFrom", () => {
  it("allows completion from shipped and delivered", () => {
    expect(canTransitionToCompletedFrom("SHIPPED")).toBe(true);
    expect(canTransitionToCompletedFrom("delivered")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionToCompletedFrom("PENDING")).toBe(false);
    expect(canTransitionToCompletedFrom("CANCELLED")).toBe(false);
    expect(canTransitionToCompletedFrom(undefined)).toBe(false);
  });
});
