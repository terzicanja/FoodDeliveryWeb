"use client";

import Image from "next/image";
import type { CartItem } from "@/lib/cart";
import { formatMealPrice } from "@/lib/restaurants";
import { useCart } from "@/context/CartProvider";

type CartItemRowProps = {
  item: CartItem;
};

export function CartItemRow({ item }: CartItemRowProps) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  const subtotal = item.price * item.quantity;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-24 sm:w-24">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={200}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            {item.name}
          </h2>
          <p className="text-sm font-semibold text-orange-700">
            {formatMealPrice(subtotal)}
          </p>
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          {formatMealPrice(item.price)} each
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-zinc-300">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => decreaseQuantity(item.mealId)}
              className="flex h-9 w-9 items-center justify-center text-lg text-zinc-700 transition hover:bg-zinc-50"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-medium text-zinc-900">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => increaseQuantity(item.mealId)}
              className="flex h-9 w-9 items-center justify-center text-lg text-zinc-700 transition hover:bg-zinc-50"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.mealId)}
            className="text-sm font-medium text-red-600 transition hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
