"use client";

import Image from "next/image";
import { useCart } from "@/context/CartProvider";
import { formatMealPrice } from "@/lib/restaurants";

export function CheckoutOrderSummary() {
  const { items, itemCount, totalPrice } = useCart();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Order summary
      </h2>

      <ul className="mt-4 divide-y divide-zinc-100">
        {items.map((item) => {
          const subtotal = item.price * item.quantity;

          return (
            <li key={item.mealId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Qty {item.quantity} · {formatMealPrice(item.price)} each
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-zinc-900">
                    {formatMealPrice(subtotal)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-500">Items</dt>
          <dd className="font-medium text-zinc-900">{itemCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-base font-medium text-zinc-900">Total</dt>
          <dd className="text-base font-semibold text-orange-700">
            {formatMealPrice(totalPrice)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
