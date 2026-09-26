import Image from "next/image";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderItemReview } from "@/components/reviews/OrderItemReview";
import type { CustomerOrderDto } from "@/lib/api/orders-client";
import type { OwnReviewDto } from "@/lib/api/reviews-client";
import {
  formatEstimatedDeliveryTime,
  formatFulfillmentType,
  formatOrderDate,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/format";
import {
  canCustomerCancelOrder,
  isReviewableOrderStatus,
} from "@/lib/order-status";
import { formatMealPrice } from "@/lib/restaurants";
import { OrderStatus } from "@prisma/client";

type OrderCardProps = {
  order: CustomerOrderDto;
  onReviewCreated?: (mealId: number, review: OwnReviewDto) => void;
  onCancel?: (orderId: number) => void;
  isCancelling?: boolean;
  cancelError?: string | null;
};

export function OrderCard({
  order,
  onReviewCreated,
  onCancel,
  isCancelling = false,
  cancelError = null,
}: OrderCardProps) {
  const canReview = isReviewableOrderStatus(order.status);
  const canCancel = canCustomerCancelOrder(order.status as OrderStatus);

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
          <p className="mt-1 text-sm text-zinc-500">
            {formatFulfillmentType(order.fulfillmentType)}
          </p>
        </div>

        <div className="text-sm sm:text-right">
          <p className="text-zinc-500">
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

      {order.note ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          Note: {order.note}
        </p>
      ) : null}

      {order.failureNote ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          Delivery failed: {order.failureNote}
        </p>
      ) : null}

      <ul className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100">
        {order.items.map((item) => (
          <li
            key={`${order.id}-${item.meal.id}`}
            className="flex items-start gap-3 py-3"
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
              {canReview ? (
                <OrderItemReview
                  mealId={item.meal.id}
                  existingReview={item.review}
                  onReviewCreated={(review) => {
                    onReviewCreated?.(item.meal.id, review);
                  }}
                />
              ) : null}
            </div>

            <p className="shrink-0 text-sm font-semibold text-zinc-900">
              {formatMealPrice(item.priceAtPurchase)}
            </p>
          </li>
        ))}
      </ul>

      {canCancel && onCancel ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => onCancel(order.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling ? "Cancelling..." : "Cancel order"}
          </button>
          {cancelError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {cancelError}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
