import Image from "next/image";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { CustomerOrderDto } from "@/lib/api/orders-client";
import { formatOrderDate, formatPaymentMethod } from "@/lib/format";
import { formatMealPrice } from "@/lib/restaurants";

type OrderCardProps = {
  order: CustomerOrderDto;
};

export function OrderCard({ order }: OrderCardProps) {
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

      <ul className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.meal.id}`}
            className="flex items-center gap-3 py-3"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {item.meal.image ? (
                <Image
                  src={item.meal.image}
                  alt={item.meal.name}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                  No image
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
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
