import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Checkout | FoodDelivery",
  description: "Review your order and delivery details before placing it.",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CheckoutView />
      </main>
    </div>
  );
}
