import { describe, expect, test } from "bun:test";
import {
  normalizeEntityName,
  resolveEntityIdByName,
} from "@/lib/entityMatching";

describe("normalizeEntityName", () => {
  test("normalizes case, accents, punctuation, and extra whitespace", () => {
    expect(normalizeEntityName("  Tárjeta, de   Crédito! ")).toBe(
      "tarjeta de credito",
    );
  });
});

describe("resolveEntityIdByName", () => {
  const accounts = [
    { id: "cash", name: "Efectivo" },
    { id: "bank", name: "Banco Pichincha" },
    { id: "card", name: "Tarjeta de Crédito" },
  ];

  test("matches exact names after normalization", () => {
    expect(resolveEntityIdByName(accounts, " banco pichincha ")).toBe("bank");
    expect(resolveEntityIdByName(accounts, "tarjeta de credito")).toBe("card");
  });

  test("accepts a unique partial match", () => {
    expect(resolveEntityIdByName(accounts, "pichincha")).toBe("bank");
  });

  test("rejects ambiguous partial matches", () => {
    expect(
      resolveEntityIdByName(
        [
          { id: "1", name: "Banco Guayaquil" },
          { id: "2", name: "Banco Pichincha" },
        ],
        "banco",
      ),
    ).toBeNull();
  });
});
