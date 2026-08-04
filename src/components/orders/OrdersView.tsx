"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderCard } from "@/components/orders/OrderCard";
import {
  fetchMyOrders,
  type CustomerOrderDto,
} from "@/lib/api/orders-client";

type OrdersStatus = "loading" | "ready" | "unauthenticated" | "error";

export function OrdersView() {
  const router = useRouter();
  const [status, setStatus] = useState<OrdersStatus>("loading");
  const [orders, setOrders] = useState<CustomerOrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const result = await fetchMyOrders();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/orders");
          return;
        }

        setError(result.error);
        setStatus("error");
        return;
      }

      setOrders(result.orders);
      setStatus("ready");
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading your orders..."}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">
          {error ?? "Could not load your orders."}
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          No orders yet
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          When you place an order, it will show up here.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          My Orders
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Track the status of every order you&apos;ve placed.
        </p>
      </div>

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    </div>
  );
}
