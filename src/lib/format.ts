import type { PaymentMethod } from "@prisma/client";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash on Delivery",
};

export function formatPaymentMethod(method: PaymentMethod | string): string {
  return (
    PAYMENT_METHOD_LABELS[method as PaymentMethod] ??
    method
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function formatMealPrice(
  price: number | string | { toString(): string },
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}

export function formatOrderDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
