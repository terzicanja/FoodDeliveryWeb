import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Cart | FoodDelivery",
  description: "Review the meals in your cart before checkout.",
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CartView />
      </main>
    </div>
  );
}
