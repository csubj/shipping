import { describe, expect, it } from "vitest";
import { AppStateSchema, emptyState } from "@/types/schema";
import { serializeState } from "@/io/export";
import { parseAndValidate } from "@/io/import";

describe("io round-trip", () => {
  it("survives serialize → parse → validate", async () => {
    const state = emptyState();
    state.meta.campaignName = "Round Trip";
    const json = serializeState(state);
    const parsed = await parseAndValidate(json);
    expect(parsed.meta.campaignName).toBe("Round Trip");
    expect(AppStateSchema.safeParse(parsed).success).toBe(true);
  });
});

describe("ids", () => {
  it("relationship id is sorted deterministically", async () => {
    const { deterministicPairId } = await import("@/domain/ids");
    expect(deterministicPairId("zebra", "apple")).toBe("apple::zebra");
    expect(deterministicPairId("apple", "zebra")).toBe("apple::zebra");
  });
});
