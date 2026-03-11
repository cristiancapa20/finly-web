import { describe, expect, test } from "bun:test";
import { amountInputToCents, centsToAmount } from "@/lib/money";

describe("amountInputToCents", () => {
  test("interprets whole numbers as the main currency unit", () => {
    expect(amountInputToCents("10")).toBe(1000);
    expect(amountInputToCents(10)).toBe(1000);
  });

  test("preserves explicit decimals", () => {
    expect(amountInputToCents("10.55")).toBe(1055);
  });
});

describe("centsToAmount", () => {
  test("converts stored cents back to the main currency unit", () => {
    expect(centsToAmount(1000)).toBe(10);
    expect(centsToAmount(1055)).toBe(10.55);
  });
});
