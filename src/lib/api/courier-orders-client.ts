import { parseApiError } from "@/lib/api/auth-client";

export type CourierOrderDto = {
  id: number;
  status: string;
  totalPrice: string | number;
  paymentMethod: string;
  createdAt: string;
  estimatedDeliveryTime: string | null;
  orderAddress: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  restaurant: {
    id: number;
    name: string;
    address: string;
  };
  items: Array<{
    quantity: number;
    priceAtPurchase: string | number;
    meal: {
      name: string;
    };
  }>;
};

export type CourierOrdersResponse = {
  available: CourierOrderDto[];
  myOrders: CourierOrderDto[];
};

export async function fetchCourierOrders() {
  const response = await fetch("/api/courier/orders", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not load deliveries.",
    };
  }

  const body = (await response.json()) as CourierOrdersResponse;

  return {
    ok: true as const,
    available: body.available,
    myOrders: body.myOrders,
  };
}

export async function acceptCourierDelivery(orderId: number) {
  const response = await fetch(`/api/courier/orders/${orderId}/accept`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error:
        errorBody.error ??
        "Could not accept this delivery. Please try another order.",
    };
  }

  const body = (await response.json()) as { order: CourierOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}

export async function markCourierOrderDelivered(orderId: number) {
  const response = await fetch(`/api/courier/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "DELIVERED" }),
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not mark this order as delivered.",
    };
  }

  const body = (await response.json()) as { order: CourierOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}
