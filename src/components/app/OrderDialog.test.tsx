import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderDialog } from "./OrderDialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });

describe("order review", () => {
  it("loads the saved portfolio and sends only a confirmed order to the API", async () => {
    localStorage.setItem("spms.portfolioIds", JSON.stringify(["17"]));
    const place = vi.spyOn(api, "placeOrder").mockResolvedValue({ order_id: 42, status: "ACCEPTED" });
    render(<QueryClientProvider client={new QueryClient()}><OrderDialog instrumentId="5" symbol="TEST" price={100} trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await waitFor(() => expect(screen.getByLabelText("Portfolio ID")).toHaveValue("17"));
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByRole("button", { name: "Submit order" });
    expect(place).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Submit order" }));
    await waitFor(() => expect(place).toHaveBeenCalledWith({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "MARKET", qty: 1 }, expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)));
    await screen.findByText("42");
  });
  it("blocks invalid lot quantities and submits a valid limit order using numeric qty", async () => {
    localStorage.setItem("spms.portfolioIds", JSON.stringify(["17"]));
    const place = vi.spyOn(api, "placeOrder").mockResolvedValue({ order_id: 43, status: "NEW" });
    render(<QueryClientProvider client={new QueryClient()}><OrderDialog instrumentId="5" symbol="TEST" price={100} lotSize={25} tickSize={0.05} trigger={<Button>Buy</Button>} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Buy" }));
    await waitFor(() => expect(screen.getByLabelText("Portfolio ID")).toHaveValue("17"));
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByText("Quantity must be a multiple of lot size 25");
    expect(place).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "LIMIT", exact: true }));
    fireEvent.change(screen.getByLabelText(/Limit price/), { target: { value: "100.11" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    await screen.findByText("Limit price must be a multiple of tick size 0.05");
    fireEvent.change(screen.getByLabelText(/Limit price/), { target: { value: "100.10" } });
    fireEvent.click(screen.getByRole("button", { name: "Review order" }));
    fireEvent.click(await screen.findByRole("button", { name: "Submit order" }));
    await waitFor(() => expect(place).toHaveBeenCalledWith({ portfolio_id: 17, instrument_id: 5, side: "BUY", type: "LIMIT", qty: 100, limit_price: 100.1 }, expect.any(String)));
    await screen.findByText("43");
  });
});