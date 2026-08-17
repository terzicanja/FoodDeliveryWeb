"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminOrderCard } from "@/components/admin/AdminOrderCard";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  type AdminOrderDto,
} from "@/lib/api/admin-orders-client";

type ViewStatus = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";

export function AdminOrdersView() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const result = await fetchAdminOrders();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/admin");
          return;
        }

        if (result.status === 403) {
          setStatus("forbidden");
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

  const handleStatusChange = async (
    orderId: number,
    nextStatus: OrderStatus,
  ) => {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    setPendingStatus(nextStatus);
    setActionErrors((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });

    try {
      const result = await updateAdminOrderStatus(orderId, nextStatus);

      if (!result.ok) {
        setActionErrors((current) => ({
          ...current,
          [orderId]: result.error,
        }));
        return;
      }

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? result.order : order)),
      );
    } catch {
      setActionErrors((current) => ({
        ...current,
        [orderId]: "Could not update the order status.",
      }));
    } finally {
      setUpdatingOrderId(null);
      setPendingStatus(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading orders..."}
      </div>
    );
  }

  if (status === "forbidden") {
    return <AdminAccessDenied />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">
          {error ?? "Could not load orders."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Orders
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Review incoming orders and move them through the kitchen workflow.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            No orders yet
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            New customer orders will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <AdminOrderCard
                order={order}
                isUpdating={updatingOrderId !== null}
                pendingStatus={
                  updatingOrderId === order.id ? pendingStatus : null
                }
                error={actionErrors[order.id] ?? null}
                onStatusChange={(nextStatus) => {
                  void handleStatusChange(order.id, nextStatus);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
