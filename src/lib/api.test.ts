import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); sessionStorage.clear(); });

async function setup() {
  vi.stubEnv("VITE_API_BASE_URL", "https://portfolio-api.test");
  vi.resetModules();
  const client = await import("./api");
  const fetcher = vi.fn().mockImplementation(async () => new Response("[]", { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  return { ...client, fetcher };
}

describe("Portfolio API endpoint contract", () => {
  it("lists portfolios with auth and creates a named INR portfolio", async () => {
    const { api, setSession, fetcher } = await setup();
    setSession({ token: "test-only-token" });
    await api.portfolios(); await api.createPortfolio({ name: "Growth", base_currency: "INR" });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://portfolio-api.test/portfolios");
    expect(fetcher.mock.calls[0]?.[1].headers.Authorization).toBe("Bearer test-only-token");
    expect(fetcher.mock.calls[1]?.[1].method).toBe("POST");
    expect(JSON.parse(fetcher.mock.calls[1]?.[1].body)).toEqual({ name: "Growth", base_currency: "INR" });
  });
  it.each([409, 422])("preserves portfolio creation error text for %s", async (status) => {
    const { api, fetcher } = await setup();
    fetcher.mockResolvedValue(new Response(JSON.stringify({ detail: "Portfolio name is already used or invalid" }), { status }));
    await expect(api.createPortfolio({ name: "Growth" })).rejects.toMatchObject({ status, message: "Portfolio name is already used or invalid" });
  });
  it("deposits the explicit instrument currency and UUID header", async () => {
    const { api, fetcher } = await setup();
    const key = "5f6f91e8-4c0d-4b4e-8f13-73db7f3a702b";
    await api.deposit("17", { amount: 100000, currency: "INR" }, key);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://portfolio-api.test/portfolios/17/deposit");
    expect(fetcher.mock.calls[0]?.[1].method).toBe("POST");
    expect(fetcher.mock.calls[0]?.[1].headers["Idempotency-Key"]).toBe(key);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({ amount: 100000, currency: "INR" });
  });
  it("requests public prices and one-minute history without a bearer token", async () => {
    const { api, setSession, fetcher } = await setup();
    setSession({ token: "test-only-token" });
    await api.prices(); await api.instrument("5"); await api.priceHistory("5");
    expect(fetcher.mock.calls.map((c) => c[0])).toEqual(["https://portfolio-api.test/prices", "https://portfolio-api.test/instruments/5", "https://portfolio-api.test/instruments/5/prices?limit=300"]);
    for (const call of fetcher.mock.calls) expect(call[1].headers).not.toHaveProperty("Authorization");
  });
  it("requests authenticated trades, ledger, and realized P&L for the selected portfolio", async () => {
    const { api, setSession, fetcher } = await setup();
    setSession({ token: "test-only-token" });
    await api.trades("17"); await api.ledger("17"); await api.realizedPnl("17");
    expect(fetcher.mock.calls.map((c) => c[0])).toEqual(["https://portfolio-api.test/portfolios/17/trades", "https://portfolio-api.test/portfolios/17/ledger", "https://portfolio-api.test/portfolios/17/realized-pnl"]);
    for (const call of fetcher.mock.calls) expect(call[1].headers.Authorization).toBe("Bearer test-only-token");
  });
  it("filters order history and sends DELETE for cancellation", async () => {
    const { api, fetcher } = await setup();
    await api.orders("17", "NEW"); await api.cancelOrder("42");
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://portfolio-api.test/orders?portfolio_id=17&status=NEW");
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://portfolio-api.test/orders/42");
    expect(fetcher.mock.calls[1]?.[1].method).toBe("DELETE");
  });
  it("sends the UUID header and preserves received-value validation errors", async () => {
    const { api, fetcher } = await setup();
    fetcher.mockResolvedValue(new Response(JSON.stringify({ detail: "qty must be a plain decimal number (got 'abc')" }), { status: 422 }));
    const key = "5f6f91e8-4c0d-4b4e-8f13-73db7f3a702b";
    await expect(api.placeOrder({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "MARKET", qty: 100.5 }, key)).rejects.toThrow("qty must be a plain decimal number (got 'abc')");
    expect(fetcher.mock.calls[0]?.[1].headers["Idempotency-Key"]).toBe(key);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "MARKET", qty: 100.5 });
  });
});