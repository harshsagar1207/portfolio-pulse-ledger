import { describe, expect, it } from "vitest";
import { orderSchema } from "./order";

const base = { portfolio_id: "1", instrument_id: "5", side: "BUY", order_type: "MARKET", quantity: 10 };

describe("order validation", () => {
  it("rejects zero or negative quantity", () => {
    expect(orderSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...base, quantity: -3 }).success).toBe(false);
  });
  it("requires a limit price for limit orders", () => {
    expect(orderSchema.safeParse({ ...base, order_type: "LIMIT" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...base, order_type: "LIMIT", limit_price: 101.5 }).success).toBe(true);
  });
  it("accepts a valid market order", () => {
    expect(orderSchema.safeParse(base).success).toBe(true);
  });
});
