"use client";

import { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { AdminOrderDto } from "@/lib/api/admin-orders-client";
import { formatOrderDate, formatPaymentMethod } from "@/lib/format";
import { getAdminAllowedNextStatuses } from "@/lib/order-status";
import { formatMealPrice } from "@/lib/restaurants";

const ADMIN_STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "Accept",
  REJECTED: "Reject",
  PREPARING: "Start Preparing",
  READY: "Mark Ready",
};

type AdminOrderCardProps = {
  order: AdminOrderDto;
  isUpdating: boolean;
  pendingStatus: string | null;
  error: string | null;
  onStatusChange: (nextStatus: OrderStatus) => void;
};

export function AdminOrderCard({
  order,
  isUpdating,
  pendingStatus,
  error,
  onStatusChange,
}: AdminOrderCardProps) {
  const nextStatuses = getAdminAllowedNextStatuses(order.status as OrderStatus);
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const courierName = order.courier
    ? `${order.courier.firstName} ${order.courier.lastName}`
    : null;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Order #{order.id}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            {order.restaurant.name}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>

        <div className="text-sm sm:text-right">
          <p className="text-zinc-500">
            {formatPaymentMethod(order.paymentMethod)}
          </p>
          <p className="mt-1 text-base font-semibold text-orange-700">
            {formatMealPrice(order.totalPrice)}
          </p>
          {order.estimatedDeliveryTime ? (
            <p className="mt-1 text-zinc-500">
              ETA {formatOrderDate(order.estimatedDeliveryTime)}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-zinc-500">Customer</dt>
          <dd className="mt-0.5 text-zinc-900">{customerName}</dd>
          <dd className="text-zinc-500">{order.customer.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Delivery address</dt>
          <dd className="mt-0.5 text-zinc-900">{order.orderAddress}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Courier</dt>
          <dd className="mt-0.5 text-zinc-900">
            {courierName ?? "Not assigned"}
          </dd>
          {order.courier ? (
            <dd className="text-zinc-500">{order.courier.phone}</dd>
          ) : null}
        </div>
      </dl>

      <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.meal.id}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900">
                {item.meal.name}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500">
                Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-zinc-900">
              {formatMealPrice(item.priceAtPurchase)}
            </p>
          </li>
        ))}
      </ul>

      {nextStatuses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          {nextStatuses.map((status) => {
            const isReject = status === OrderStatus.REJECTED;
            const isPending = isUpdating && pendingStatus === status;

            return (
              <button
                key={status}
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  onStatusChange(status);
                }}
                className={
                  isReject
                    ? "inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    : "inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                }
              >
                {isPending
                  ? "Updating..."
                  : (ADMIN_STATUS_ACTION_LABELS[status] ?? status)}
              </button>
            );
          })}
        </div>
      ) : order.status === OrderStatus.READY ? (
        <p className="mt-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
          Waiting for a courier to pick up this order.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
    </article>
  );
}
