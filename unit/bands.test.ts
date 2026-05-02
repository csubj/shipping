import { describe, expect, it } from "vitest";
import { valueToBand } from "@/domain/bands";
import { DEFAULT_BANDS } from "@/types/schema";

describe("valueToBand", () => {
  it("returns Strangers at 0", () => {
    expect(valueToBand(0, DEFAULT_BANDS).name).toBe("Strangers");
  });
  it("classifies positive boundary values", () => {
    expect(valueToBand(1, DEFAULT_BANDS).name).toBe("Acquaintances");
    expect(valueToBand(9, DEFAULT_BANDS).name).toBe("Acquaintances");
    expect(valueToBand(10, DEFAULT_BANDS).name).toBe("Friends");
    expect(valueToBand(19, DEFAULT_BANDS).name).toBe("Friends");
    expect(valueToBand(20, DEFAULT_BANDS).name).toBe("Close Allies");
    expect(valueToBand(999, DEFAULT_BANDS).name).toBe("Close Allies");
  });
  it("mirrors the negative side", () => {
    expect(valueToBand(-1, DEFAULT_BANDS).name).toBe("Unfriendly");
    expect(valueToBand(-10, DEFAULT_BANDS).name).toBe("Enemies");
    expect(valueToBand(-20, DEFAULT_BANDS).name).toBe("Nemeses");
  });
  it("colors agree with sign", () => {
    expect(valueToBand(15, DEFAULT_BANDS).sign).toBe(1);
    expect(valueToBand(-15, DEFAULT_BANDS).sign).toBe(-1);
    expect(valueToBand(0, DEFAULT_BANDS).sign).toBe(0);
  });
});
