import type {
  FulfillmentType,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "@prisma/client";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on delivery",
  CARD_ON_DELIVERY: "Card on delivery",
  CARD: "Pay by card",
};

const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
};

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Customer",
  RESTAURANT: "Restaurant",
  COURIER: "Courier",
  ADMIN: "Admin",
};

function titleCaseFromEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPaymentMethod(method: PaymentMethod | string): string {
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? titleCaseFromEnum(method);
}

export function formatFulfillmentType(
  fulfillmentType: FulfillmentType | string,
): string {
  return (
    FULFILLMENT_TYPE_LABELS[fulfillmentType as FulfillmentType] ??
    titleCaseFromEnum(fulfillmentType)
  );
}

export function formatPaymentStatus(status: PaymentStatus | string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? titleCaseFromEnum(status);
}

export function formatRole(role: Role | string): string {
  return ROLE_LABELS[role as Role] ?? titleCaseFromEnum(role);
}

export function formatEstimatedDeliveryTime(minutes: number): string {
  return `Estimated time: ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
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
