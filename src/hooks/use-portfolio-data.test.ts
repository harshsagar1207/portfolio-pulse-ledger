import { describe, expect, it } from "vitest";
import { CHART_POLL_MS, PRICE_POLL_MS, inst, mergeLivePrice } from "./use-portfolio-data";

describe("simulator price contract", () => {
  it("polls prices every 1–2 seconds", () => { expect(PRICE_POLL_MS).toBeGreaterThanOrEqual(1000); expect(PRICE_POLL_MS).toBeLessThanOrEqual(2000); });
  it("refreshes candles every 10–30 seconds", () => { expect(CHART_POLL_MS).toBeGreaterThanOrEqual(10000); expect(CHART_POLL_MS).toBeLessThanOrEqual(30000); });
  it("uses price and ts from the matching instrument without changing another instrument", () => {
    const row = { instrument_id: 5, last_price: 100, price_ts: "old" };
    const prices = [{ instrument_id: 5, price: 101.5, ts: "2026-10-26T13:47:00Z" }];
    const merged = mergeLivePrice(row, prices);
    expect(inst.price(merged)).toBe(101.5); expect(inst.ts(merged)).toBe("2026-10-26T13:47:00Z");
    expect(mergeLivePrice({ ...row, instrument_id: 6 }, prices)["last_price"]).toBe(100);
  });
});