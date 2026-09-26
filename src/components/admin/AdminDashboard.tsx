"use client";

import { useState } from "react";
import { AdminRestaurantsView } from "@/components/admin/AdminRestaurantsView";
import { AdminUsersView } from "@/components/admin/AdminUsersView";

type AdminTab = "restaurants" | "users";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "restaurants", label: "Restaurants" },
  { id: "users", label: "Users" },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("restaurants");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Admin dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage users and restaurants. Meals and orders are not managed here.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3"
        role="tablist"
        aria-label="Admin sections"
      >
        {TABS.map((item) => {
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(item.id)}
              className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-600 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "restaurants" ? <AdminRestaurantsView /> : null}
      {tab === "users" ? <AdminUsersView /> : null}
    </div>
  );
}
