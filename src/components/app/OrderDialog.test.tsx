import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderDialog } from "./OrderDialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

vi.mock("@/lib/auth", () => ({ useAuth: () => ({ session: { token: "test-token" }, ready: true }) }));
vi.mock("@/lib/api", async (original) => ({ ...await original<typeof import("@/lib/api")>(), isApiConfigured: () => true }));
beforeEach(() => { vi.spyOn(api, "portfolios").mockResolvedValue([{ portfolio_id: 17, name: "Main", base_currency: "INR" }]); });

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });

describe("order review", () => {
  it("defaults to the first authenticated portfolio and sends only a confirmed order", async () => {
    const place = vi.spyOn(api, "placeOrder").mockResolvedValue({ order_id: 42, status: "ACCEPTED" });
    render(<QueryClientProvider client={new QueryClient()}><OrderDialog instrumentId="5" symbol="TEST" price={100} trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await screen.findByRole("combobox", { name: "Portfolio" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByRole("button", { name: "Submit order" });
    expect(place).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Submit order" }));
    await waitFor(() => expect(place).toHaveBeenCalledWith({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "MARKET", qty: 1 }, expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)));
    await screen.findByText("42");
  });
  it("blocks invalid lot quantities and submits a valid limit order using numeric qty", async () => {
    const place = vi.spyOn(api, "placeOrder").mockResolvedValue({ order_id: 43, status: "NEW" });
    render(<QueryClientProvider client={new QueryClient()}><OrderDialog instrumentId="5" symbol="TEST" price={100} lotSize={25} tickSize={0.05} trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByText("Quantity must be a multiple of lot size 25");
    expect(place).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /^LIMIT$/ }));
    fireEvent.change(screen.getByLabelText(/Limit price/), { target: { value: "100.11" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByText("Limit price must be a multiple of tick size 0.05");
    fireEvent.change(screen.getByLabelText(/Limit price/), { target: { value: "100.10" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Submit order" }));
    await waitFor(() => expect(place).toHaveBeenCalledWith({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "LIMIT", qty: 100, limit_price: 100.1 }, expect.any(String)));
    await screen.findByText("43");
  });
  it("creates a first portfolio and selects its returned ID for the order", async () => {
    vi.mocked(api.portfolios).mockResolvedValue([]);
    const created = { portfolio_id: 28, name: "Growth", base_currency: "INR" };
    const create = vi.spyOn(api, "createPortfolio").mockImplementation(async () => {
      vi.mocked(api.portfolios).mockResolvedValue([created]); return created;
    });
    const place = vi.spyOn(api, "placeOrder").mockResolvedValue({ order_id: 44, status: "NEW" });
    render(<QueryClientProvider client={new QueryClient()}><OrderDialog instrumentId="5" symbol="TEST" price={100} trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await screen.findByText("Create your first portfolio");
    expect(screen.queryByRole("button", { name: "Review order" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ New portfolio" }));
    fireEvent.change(screen.getByLabelText("Portfolio name"), { target: { value: "Growth" } });
    fireEvent.click(screen.getByRole("button", { name: "Create portfolio" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Portfolio" })).toHaveTextContent("Growth"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Review order" })).toBeEnabled());
    expect(create).toHaveBeenCalledWith({ name: "Growth", base_currency: "INR" });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Submit order" }));
    await waitFor(() => expect(place).toHaveBeenCalledWith(expect.objectContaining({ portfolio_id: 28 }), expect.any(String)));
  });
  it("deposits 100000 in the instrument currency with a new UUID for every click and refreshes the portfolio", async () => {
    const deposit = vi.spyOn(api, "deposit").mockResolvedValue({});
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    render(<QueryClientProvider client={client}><OrderDialog instrumentId="5" symbol="TEST" price={100} currency="INR" trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Add funds" })).toBeEnabled());
    for (let n = 1; n <= 2; n++) {
      fireEvent.click(screen.getByRole("button", { name: "Add funds" }));
      fireEvent.click(await screen.findByRole("button", { name: "Deposit funds" }));
      await screen.findByRole("button", { name: "Review order" });
      expect(deposit).toHaveBeenCalledTimes(n);
    }
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(deposit).toHaveBeenCalledWith("17", { amount: 100000, currency: "INR" }, expect.stringMatching(uuid));
    expect(deposit.mock.calls[0]?.[2]).not.toBe(deposit.mock.calls[1]?.[2]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["portfolio"] });
  });
});