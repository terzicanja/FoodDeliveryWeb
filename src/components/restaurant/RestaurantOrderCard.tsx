"use client";

import { useState } from "react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { RestaurantOrderDto } from "@/lib/api/restaurant-client";
import {
  formatEstimatedDeliveryTime,
  formatFulfillmentType,
  formatOrderDate,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/format";
import { formatMealPrice } from "@/lib/restaurants";
import {
  DEFAULT_ACCEPT_ETA_MINUTES,
  MAX_ACCEPT_ETA_MINUTES,
  MIN_ACCEPT_ETA_MINUTES,
} from "@/lib/validations/restaurant";

type RestaurantOrderCardProps = {
  order: RestaurantOrderDto;
  isUpdating: boolean;
  error: string | null;
  onAccept: (orderId: number, estimatedDeliveryTime: number) => void;
  onReject: (orderId: number) => void;
  onStartPreparing: (orderId: number) => void;
  onMarkReady: (orderId: number) => void;
  onMarkPickedUp: (orderId: number) => void;
};

export function RestaurantOrderCard({
  order,
  isUpdating,
  error,
  onAccept,
  onReject,
  onStartPreparing,
  onMarkReady,
  onMarkPickedUp,
}: RestaurantOrderCardProps) {
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(DEFAULT_ACCEPT_ETA_MINUTES);
  const [etaError, setEtaError] = useState<string | null>(null);

  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const isPickup = order.fulfillmentType === "PICKUP";

  const handleConfirmAccept = () => {
    if (
      !Number.isInteger(etaMinutes) ||
      etaMinutes < MIN_ACCEPT_ETA_MINUTES ||
      etaMinutes > MAX_ACCEPT_ETA_MINUTES
    ) {
      setEtaError(
        `Enter a whole number between ${MIN_ACCEPT_ETA_MINUTES} and ${MAX_ACCEPT_ETA_MINUTES} minutes.`,
      );
      return;
    }

    setEtaError(null);
    onAccept(order.id, etaMinutes);
  };

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
          <dd className="text-zinc-500">{order.customer.phone}</dd>
          <dd className="text-zinc-500">{order.customer.email}</dd>
        </div>
        {!isPickup ? (
          <div>
            <dt className="font-medium text-zinc-500">Delivery address</dt>
            <dd className="mt-0.5 text-zinc-900">{order.orderAddress}</dd>
          </div>
        ) : (
          <div>
            <dt className="font-medium text-zinc-500">Pickup</dt>
            <dd className="mt-0.5 text-zinc-900">
              Customer will collect at the restaurant
            </dd>
          </div>
        )}
      </dl>

      {order.note ? (
        <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">Order note:</p>
          <p className="mt-0.5">&ldquo;{order.note}&rdquo;</p>
        </div>
      ) : null}

      {order.failureNote ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failure note: {order.failureNote}
        </p>
      ) : null}

      <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
        {order.items.map((item, index) => (
          <li
            key={`${order.id}-${item.meal.id}-${index}`}
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

      <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        {order.status === "PENDING" && !showAcceptForm ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => {
                setEtaMinutes(DEFAULT_ACCEPT_ETA_MINUTES);
                setEtaError(null);
                setShowAcceptForm(true);
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onReject(order.id)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        ) : null}

        {order.status === "PENDING" && showAcceptForm ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <label
              htmlFor={`eta-${order.id}`}
              className="block text-sm font-medium text-zinc-700"
            >
              Estimated time (minutes)
            </label>
            <input
              id={`eta-${order.id}`}
              type="number"
              min={MIN_ACCEPT_ETA_MINUTES}
              max={MAX_ACCEPT_ETA_MINUTES}
              step={1}
              value={etaMinutes}
              disabled={isUpdating}
              onChange={(event) => {
                setEtaMinutes(Number(event.target.value));
                setEtaError(null);
              }}
              className="mt-2 h-10 w-full max-w-[12rem] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
            {etaError ? (
              <p className="mt-2 text-sm text-red-600">{etaError}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleConfirmAccept}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "Accepting..." : "Confirm accept"}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => {
                  setShowAcceptForm(false);
                  setEtaError(null);
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
            </div>
          </div>
        ) : null}

        {order.status === "ACCEPTED" ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onStartPreparing(order.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : "Start preparing"}
          </button>
        ) : null}

        {order.status === "PREPARING" ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onMarkReady(order.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : "Mark ready"}
          </button>
        ) : null}

        {order.status === "READY" && isPickup ? (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onMarkPickedUp(order.id)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : "Mark picked up"}
          </button>
        ) : null}

        {order.status === "READY" && !isPickup ? (
          <p className="text-sm text-zinc-500">
            Waiting for a courier to pick up this delivery order.
          </p>
        ) : null}
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
