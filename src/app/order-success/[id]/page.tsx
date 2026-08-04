import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OrderSuccessView } from "@/components/orders/OrderSuccessView";

export const metadata: Metadata = {
  title: "Order Success | FoodDelivery",
  description: "Your order was placed successfully.",
};

type OrderSuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    totalPrice?: string;
  }>;
};

export default async function OrderSuccessPage({
  params,
  searchParams,
}: OrderSuccessPageProps) {
  const { id } = await params;
  const { status, totalPrice } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <OrderSuccessView
          orderId={id}
          status={status}
          totalPrice={totalPrice}
        />
      </main>
    </div>
  );
}
