import { parseApiError } from "@/lib/api/auth-client";

export type AdminOrderDto = {
  id: number;
  status: string;
  totalPrice: string | number;
  paymentMethod: string;
  createdAt: string;
  estimatedDeliveryTime: string | null;
  orderAddress: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  restaurant: {
    id: number;
    name: string;
  };
  courier: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  items: Array<{
    quantity: number;
    priceAtPurchase: string | number;
    meal: {
      id: number;
      name: string;
    };
  }>;
};

export async function fetchAdminOrders() {
  const response = await fetch("/api/admin/orders", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not load orders.",
    };
  }

  const body = (await response.json()) as { orders: AdminOrderDto[] };

  return {
    ok: true as const,
    orders: body.orders,
  };
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: string,
) {
  const response = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not update the order status.",
    };
  }

  const body = (await response.json()) as { order: AdminOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}
