import { describe, expect, it } from "vitest";
import { createOrderSchema, orderPayload, orderSchema } from "./order";

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
  it("accepts plain decimal numbers or strings and rejects commas, empty, null and invalid values", () => {
    for (const quantity of [100, "100", "100.5"]) expect(orderSchema.safeParse({ ...base, quantity }).success).toBe(true);
    for (const quantity of ["1,000", "", null, "abc", "1e2", Infinity]) expect(orderSchema.safeParse({ ...base, quantity }).success).toBe(false);
  });
  it("requires integer IDs", () => {
    expect(orderSchema.safeParse({ ...base, portfolio_id: "17.5" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...base, instrument_id: "abc" }).success).toBe(false);
    expect(orderSchema.safeParse({ ...base, portfolio_id: "17", instrument_id: "5" }).success).toBe(true);
  });
  it("enforces instrument lot-size multiples including fractional lots", () => {
    expect(createOrderSchema(25, 0.05).safeParse({ ...base, quantity: 100 }).success).toBe(true);
    expect(createOrderSchema(25, 0.05).safeParse({ ...base, quantity: 100.5 }).success).toBe(false);
    expect(createOrderSchema(0.1).safeParse({ ...base, quantity: "0.3" }).success).toBe(true);
  });
  it("enforces limit-price tick multiples without rounding the price", () => {
    expect(createOrderSchema(1, 0.05).safeParse({ ...base, order_type: "LIMIT", limit_price: "100.10" }).success).toBe(true);
    expect(createOrderSchema(1, 0.05).safeParse({ ...base, order_type: "LIMIT", limit_price: "100.11" }).success).toBe(false);
  });
  it("sends qty and type with integer IDs and omits market limit prices", () => {
    expect(orderPayload(orderSchema.parse({ ...base, quantity: "100.5" }))).toEqual({ portfolio_id: 1, instrument_id: 5, side: "BUY", type: "MARKET", qty: 100.5 });
    expect(orderPayload(orderSchema.parse({ ...base, order_type: "LIMIT", limit_price: "101.5" }))).toEqual({ portfolio_id: 1, instrument_id: 5, side: "BUY", type: "LIMIT", qty: 10, limit_price: 101.5 });
  });
});
