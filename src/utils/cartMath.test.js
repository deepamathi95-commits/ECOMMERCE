import { describe, expect, it } from "vitest";
import { computeSummary } from "./cartMath";

const rules = { shipping_flat_rate: "5.00", free_shipping_threshold: "100.00" };
const item = (list, unit, quantity) => ({ list_price: list, unit_price: unit, quantity });

describe("computeSummary", () => {
  it("adds flat shipping below the threshold", () => {
    expect(computeSummary([item("50.00", "40.00", 1)], rules)).toMatchObject({ subtotal: "50.00", discount: "10.00", shipping: "5.00", total: "45.00" });
  });
  it("gives free shipping once payable reaches the threshold", () => {
    expect(computeSummary([item("80.00", "60.00", 2)], rules)).toMatchObject({ subtotal: "160.00", discount: "40.00", shipping: "0.00", total: "120.00" });
  });
  it("is zero for an empty cart", () => {
    expect(computeSummary([], rules).total).toBe("0.00");
  });
});
