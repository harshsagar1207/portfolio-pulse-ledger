import { z } from "zod";

export const ORDER_STATUSES = ["NEW", "ACCEPTED", "PARTIALLY_FILLED", "FILLED", "CANCELLED", "REJECTED", "EXPIRED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusTone = (s: string): "pending" | "gain" | "loss" | "muted" => {
  switch (s?.toUpperCase()) {
    case "NEW":
    case "ACCEPTED":
    case "PARTIALLY_FILLED":
      return "pending";
    case "FILLED":
      return "gain";
    case "REJECTED":
      return "loss";
    default:
      return "muted";
  }
};

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export const orderSchema = z
  .object({
    portfolio_id: z.string().trim().min(1, "Portfolio ID is required"),
    instrument_id: z.string().trim().min(1, "Choose an instrument"),
    side: z.enum(["BUY", "SELL"]),
    order_type: z.enum(["MARKET", "LIMIT"]),
    quantity: z.coerce
      .number({ invalid_type_error: "Enter a quantity" })
      .positive("Quantity must be greater than zero")
      .refine((n) => decimals(n) <= 4, "At most 4 decimal places"),
    limit_price: z.coerce.number().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.order_type === "LIMIT") {
      if (v.limit_price === undefined || !Number.isFinite(v.limit_price) || v.limit_price <= 0)
        ctx.addIssue({ code: "custom", path: ["limit_price"], message: "Limit price is required for limit orders" });
      else if (decimals(v.limit_price) > 2)
        ctx.addIssue({ code: "custom", path: ["limit_price"], message: "At most 2 decimal places" });
    }
  });

export type OrderInput = z.infer<typeof orderSchema>;
