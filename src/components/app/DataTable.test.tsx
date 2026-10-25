import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";

afterEach(cleanup);

describe("table interactions", () => {
  const rows = [{ amount: 30 }, { amount: 10 }, { amount: 20 }];
  const columns = [{ key: "amount" }];
  it("sorts numeric values and returns to the first page", () => {
    render(<DataTable rows={rows} columns={columns} pageSize={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Amount" }));
    expect(screen.getByRole("cell")).toHaveTextContent("10");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Amount" }));
    expect(screen.getByRole("cell")).toHaveTextContent("30");
  });
  it("opens a row using the keyboard", () => {
    const open = vi.fn();
    render(<DataTable rows={rows} columns={columns} onRowClick={open} />);
    fireEvent.keyDown(screen.getByText("30").closest("tr") as HTMLTableRowElement, { key: "Enter" });
    expect(open).toHaveBeenCalledWith({ amount: 30 });
  });
});