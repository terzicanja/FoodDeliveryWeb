import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OrdersView } from "@/components/orders/OrdersView";

export const metadata: Metadata = {
  title: "My Orders | FoodDelivery",
  description: "View the orders you have placed.",
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <OrdersView />
      </main>
    </div>
  );
}
