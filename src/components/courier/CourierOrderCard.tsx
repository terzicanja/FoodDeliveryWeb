"use client";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { CourierOrderDto } from "@/lib/api/courier-orders-client";
import { formatOrderDate, formatPaymentMethod } from "@/lib/format";
import { formatMealPrice } from "@/lib/restaurants";

type CourierOrderCardProps = {
  order: CourierOrderDto;
  actionLabel: string;
  isUpdating: boolean;
  error: string | null;
  onAction: () => void;
};

export function CourierOrderCard({
  order,
  actionLabel,
  isUpdating,
  error,
  onAction,
}: CourierOrderCardProps) {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
              Order #{order.id}
            </h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            {order.restaurant.name}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">
            {order.restaurant.address}
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
          <dd className="text-zinc-500">{order.customer.phone}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Delivery address</dt>
          <dd className="mt-0.5 text-zinc-900">{order.orderAddress}</dd>
        </div>
      </dl>

      <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
        {order.items.map((item, index) => (
          <li
            key={`${order.id}-${item.meal.name}-${index}`}
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

      <div className="mt-4 border-t border-zinc-100 pt-4">
        <button
          type="button"
          disabled={isUpdating}
          onClick={onAction}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating ? "Updating..." : actionLabel}
        </button>
      </div>

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
