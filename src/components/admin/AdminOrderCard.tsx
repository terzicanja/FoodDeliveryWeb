"use client";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { AdminOrderDto } from "@/lib/api/admin-orders-client";
import {
  formatEstimatedDeliveryTime,
  formatFulfillmentType,
  formatOrderDate,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/format";
import { formatMealPrice } from "@/lib/restaurants";

type AdminOrderCardProps = {
  order: AdminOrderDto;
};

export function AdminOrderCard({ order }: AdminOrderCardProps) {
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
            {formatFulfillmentType(order.fulfillmentType)}
          </p>
          <p className="mt-1 text-zinc-500">
            {formatPaymentMethod(order.paymentMethod)}
          </p>
          <p className="mt-1 text-zinc-500">
            Payment {formatPaymentStatus(order.paymentStatus).toLowerCase()}
          </p>
          <p className="mt-1 text-base font-semibold text-orange-700">
            {formatMealPrice(order.totalPrice)}
          </p>
          {order.estimatedDeliveryTime != null ? (
            <p className="mt-1 text-zinc-500">
              {formatEstimatedDeliveryTime(order.estimatedDeliveryTime)}
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
          <dt className="font-medium text-zinc-500">Address</dt>
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

      {order.note ? (
        <p className="mt-4 text-sm text-zinc-600">Note: {order.note}</p>
      ) : null}

      {order.failureNote ? (
        <p className="mt-2 text-sm text-red-700">
          Failure note: {order.failureNote}
        </p>
      ) : null}

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
    </article>
  );
}
