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
});