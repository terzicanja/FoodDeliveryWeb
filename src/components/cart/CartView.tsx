"use client";

import Link from "next/link";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { useCart } from "@/context/CartProvider";
import { formatMealPrice } from "@/lib/restaurants";

export function CartView() {
  const { items, itemCount, totalPrice, isReady } = useCart();

  if (!isReady) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Browse restaurants and add something delicious to get started.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Your cart
        </h1>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.mealId}>
              <CartItemRow item={item} />
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Order summary
        </h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-zinc-500">Items</dt>
            <dd className="font-medium text-zinc-900">{itemCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3">
            <dt className="text-base font-medium text-zinc-900">Total</dt>
            <dd className="text-base font-semibold text-orange-700">
              {formatMealPrice(totalPrice)}
            </dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-600 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
