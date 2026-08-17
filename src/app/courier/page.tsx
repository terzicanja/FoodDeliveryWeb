import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CourierAccessDenied } from "@/components/courier/CourierAccessDenied";
import { CourierOrdersView } from "@/components/courier/CourierOrdersView";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthPayload } from "@/lib/auth-request";

export const metadata: Metadata = {
  title: "Courier | FoodDelivery",
  description: "Accept and complete food delivery orders.",
};

export default async function CourierPage() {
  const auth = await getAuthPayload();

  if (!auth) {
    redirect("/login?next=/courier");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {auth.role === Role.COURIER ? (
          <CourierOrdersView />
        ) : (
          <CourierAccessDenied />
        )}
      </main>
    </div>
  );
}
