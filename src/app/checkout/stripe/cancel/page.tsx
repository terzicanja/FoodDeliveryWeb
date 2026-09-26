import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Payment Cancelled | FoodDelivery",
  description: "Your Stripe Checkout payment was cancelled.",
};

export default function StripeCheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Payment cancelled
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            The Stripe payment was cancelled. No order was created. You can
            return to checkout and try again.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Return to checkout
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
