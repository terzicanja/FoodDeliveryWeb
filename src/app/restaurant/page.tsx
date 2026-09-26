import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RestaurantAccessDenied } from "@/components/restaurant/RestaurantAccessDenied";
import { RestaurantDashboard } from "@/components/restaurant/RestaurantDashboard";
import { getAuthPayload } from "@/lib/auth-request";

export const metadata: Metadata = {
  title: "Restaurant | FoodDelivery",
  description: "Manage your restaurant menu and kitchen orders.",
};

export default async function RestaurantPage() {
  const auth = await getAuthPayload();

  if (!auth) {
    redirect("/login?next=/restaurant");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {auth.role === Role.RESTAURANT ? (
          <RestaurantDashboard />
        ) : (
          <RestaurantAccessDenied />
        )}
      </main>
    </div>
  );
}
