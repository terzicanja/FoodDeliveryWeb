"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CourierAccessDenied } from "@/components/courier/CourierAccessDenied";
import { CourierOrderCard } from "@/components/courier/CourierOrderCard";
import {
  acceptCourierDelivery,
  fetchCourierOrders,
  markCourierOrderDelivered,
  markCourierOrderFailed,
  type CourierOrderDto,
} from "@/lib/api/courier-orders-client";

type ViewStatus = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";

export function CourierOrdersView() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [available, setAvailable] = useState<CourierOrderDto[]>([]);
  const [myOrders, setMyOrders] = useState<CourierOrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const result = await fetchCourierOrders();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/courier");
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

      setAvailable(result.available);
      setMyOrders(result.myOrders);
      setStatus("ready");
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const clearActionError = (orderId: number) => {
    setActionErrors((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });
  };

  const handleAccept = async (orderId: number) => {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    clearActionError(orderId);

    try {
      const result = await acceptCourierDelivery(orderId);

      if (!result.ok) {
        setActionErrors((current) => ({
          ...current,
          [orderId]: result.error,
        }));
        return;
      }

      setAvailable((current) => current.filter((order) => order.id !== orderId));
      setMyOrders((current) => [result.order, ...current]);
    } catch {
      setActionErrors((current) => ({
        ...current,
        [orderId]: "Could not accept this delivery.",
      }));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeliver = async (orderId: number) => {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    clearActionError(orderId);

    try {
      const result = await markCourierOrderDelivered(orderId);

      if (!result.ok) {
        setActionErrors((current) => ({
          ...current,
          [orderId]: result.error,
        }));
        return;
      }

      setMyOrders((current) => current.filter((order) => order.id !== orderId));
    } catch {
      setActionErrors((current) => ({
        ...current,
        [orderId]: "Could not mark this order as delivered.",
      }));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleFail = async (orderId: number, failureNote: string) => {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    clearActionError(orderId);

    try {
      const result = await markCourierOrderFailed(orderId, failureNote);

      if (!result.ok) {
        setActionErrors((current) => ({
          ...current,
          [orderId]: result.error,
        }));
        return;
      }

      setMyOrders((current) => current.filter((order) => order.id !== orderId));
    } catch {
      setActionErrors((current) => ({
        ...current,
        [orderId]: "Could not mark this delivery as failed.",
      }));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading deliveries..."}
      </div>
    );
  }

  if (status === "forbidden") {
    return <CourierAccessDenied />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">
          {error ?? "Could not load deliveries."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Courier dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Accept ready orders, complete deliveries, or mark a delivery as
          failed when it cannot be completed.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Available deliveries
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ready orders waiting for a courier.
          </p>
        </div>

        {available.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              No deliveries are available right now.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {available.map((order) => (
              <li key={order.id}>
                <CourierOrderCard
                  order={order}
                  mode="available"
                  isUpdating={updatingOrderId !== null}
                  error={actionErrors[order.id] ?? null}
                  onAccept={() => {
                    void handleAccept(order.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            My active deliveries
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Orders you have accepted and are currently delivering.
          </p>
        </div>

        {myOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              You have no active deliveries.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {myOrders.map((order) => (
              <li key={order.id}>
                <CourierOrderCard
                  order={order}
                  mode="active"
                  isUpdating={updatingOrderId === order.id}
                  error={actionErrors[order.id] ?? null}
                  onDeliver={() => {
                    void handleDeliver(order.id);
                  }}
                  onFail={(failureNote) => {
                    void handleFail(order.id, failureNote);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
