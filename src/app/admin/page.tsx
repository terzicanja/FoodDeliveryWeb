import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthPayload } from "@/lib/auth-request";

export const metadata: Metadata = {
  title: "Admin | FoodDelivery",
  description: "Manage orders, restaurants, meals, and users.",
};

export default async function AdminPage() {
  const auth = await getAuthPayload();

  if (!auth) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {auth.role === Role.ADMIN ? (
          <AdminDashboard />
        ) : (
          <AdminAccessDenied />
        )}
      </main>
    </div>
  );
}
