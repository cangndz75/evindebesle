import { describe, expect, it } from "vitest";

import {
  consumeReplayToken,
  createReplayFingerprint,
  isWebhookTimestampFresh,
} from "@/lib/security/replay-guard";

describe("isWebhookTimestampFresh", () => {
  it("accepts recent epoch second timestamps", () => {
    const now = Date.now();
    const epochSeconds = Math.floor(now / 1000).toString();
    expect(isWebhookTimestampFresh(epochSeconds, 300, now)).toBe(true);
  });

  it("rejects stale timestamps", () => {
    const now = Date.now();
    const staleEpoch = Math.floor((now - 600_000) / 1000).toString();
    expect(isWebhookTimestampFresh(staleEpoch, 300, now)).toBe(false);
  });
});

describe("consumeReplayToken", () => {
  it("rejects replayed payload fingerprints", async () => {
    const fingerprint = createReplayFingerprint({
      signature: "abc",
      timestamp: Date.now().toString(),
      body: "{\"ok\":true}",
      eventId: "evt_1",
    });

    await expect(consumeReplayToken(fingerprint, 60)).resolves.toBe(true);
    await expect(consumeReplayToken(fingerprint, 60)).resolves.toBe(false);
  });
});
