import Link from "next/link";
import { formatMealPrice } from "@/lib/restaurants";

type OrderSuccessViewProps = {
  orderId: string;
  status?: string;
  totalPrice?: string;
};

function formatOrderStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function OrderSuccessView({
  orderId,
  status,
  totalPrice,
}: OrderSuccessViewProps) {
  const parsedTotal =
    totalPrice !== undefined && totalPrice !== ""
      ? Number(totalPrice)
      : Number.NaN;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm sm:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Order placed successfully
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Thanks for your order. We&apos;ll start preparing it shortly.
      </p>

      <dl className="mt-8 space-y-3 rounded-xl bg-zinc-50 px-4 py-5 text-left text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-500">Order ID</dt>
          <dd className="font-semibold text-zinc-900">#{orderId}</dd>
        </div>

        {status ? (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-zinc-500">Status</dt>
            <dd className="font-medium text-zinc-900">
              {formatOrderStatus(status)}
            </dd>
          </div>
        ) : null}

        {Number.isFinite(parsedTotal) ? (
          <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3">
            <dt className="text-zinc-500">Total</dt>
            <dd className="font-semibold text-orange-700">
              {formatMealPrice(parsedTotal)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Back to home
        </Link>
        <Link
          href="/orders"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          My Orders
        </Link>
      </div>
    </div>
  );
}
