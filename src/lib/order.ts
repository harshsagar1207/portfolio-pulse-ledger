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

export const isMultiple = (value: number, increment: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(increment) || increment <= 0) return false;
  const ratio = value / increment;
  return Math.abs(ratio - Math.round(ratio)) <= 1e-8;
};

const plainDecimal = z.union([
  z.number().finite(),
  z.string().regex(/^\d+(?:\.\d+)?$/, "Enter a plain decimal number (no commas)").transform(Number),
]);
const integerId = z.string().trim().regex(/^\d+$/, "ID must be an integer")
  .refine((v) => Number.isSafeInteger(Number(v)) && Number(v) > 0, "Enter a positive integer ID");

export const createOrderSchema = (lotSize?: number | null, tickSize?: number | null) => z
  .object({
    portfolio_id: integerId,
    instrument_id: integerId,
    side: z.enum(["BUY", "SELL"]),
    order_type: z.enum(["MARKET", "LIMIT"]),
    quantity: plainDecimal.refine((n) => n > 0 && Number.isFinite(n), "Quantity must be greater than zero"),
    limit_price: plainDecimal.optional(),
  })
  .superRefine((v, ctx) => {
    if (lotSize && !isMultiple(v.quantity, lotSize))
      ctx.addIssue({ code: "custom", path: ["quantity"], message: `Quantity must be a multiple of lot size ${lotSize}` });
    if (v.order_type === "LIMIT") {
      if (v.limit_price === undefined || !Number.isFinite(v.limit_price) || v.limit_price <= 0)
        ctx.addIssue({ code: "custom", path: ["limit_price"], message: "Limit price is required for limit orders" });
      else if (tickSize && !isMultiple(v.limit_price, tickSize))
        ctx.addIssue({ code: "custom", path: ["limit_price"], message: `Limit price must be a multiple of tick size ${tickSize}` });
    }
  });

export const orderSchema = createOrderSchema();

export function orderPayload(o: OrderInput) {
  return { portfolio_id: Number(o.portfolio_id), instrument_id: Number(o.instrument_id), side: o.side, type: o.order_type, qty: o.quantity,
    ...(o.order_type === "LIMIT" ? { limit_price: o.limit_price } : {}) };
}

export type OrderInput = z.infer<typeof orderSchema>;
