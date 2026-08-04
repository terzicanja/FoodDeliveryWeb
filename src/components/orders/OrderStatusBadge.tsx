import type { OrderStatus } from "@prisma/client";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  ACCEPTED: "bg-sky-50 text-sky-800 ring-sky-200",
  PREPARING: "bg-orange-50 text-orange-800 ring-orange-200",
  READY: "bg-violet-50 text-violet-800 ring-violet-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-800 ring-red-200",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
};

type OrderStatusBadgeProps = {
  status: OrderStatus | string;
  className?: string;
};

export function OrderStatusBadge({
  status,
  className = "",
}: OrderStatusBadgeProps) {
  const normalized = status as OrderStatus;
  const label = ORDER_STATUS_LABELS[normalized] ?? status;
  const styles =
    ORDER_STATUS_STYLES[normalized] ??
    "bg-zinc-50 text-zinc-700 ring-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles} ${className}`}
    >
      {label}
    </span>
  );
}

export function formatOrderStatusLabel(status: string): string {
  const normalized = status as OrderStatus;
  return ORDER_STATUS_LABELS[normalized] ?? status;
}
