import { parseApiError } from "@/lib/api/auth-client";

export type CreatedOrderResponse = {
  id: number;
  status: string;
  totalPrice: string | number;
  createdAt: string;
};

export type CreateOrderRequest = {
  deliveryAddress: string;
  paymentMethod: "CASH";
  items: Array<{
    mealId: string;
    quantity: number;
  }>;
};

export async function createOrderRequest(payload: CreateOrderRequest) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not place your order. Please try again.",
    };
  }

  const body = (await response.json()) as { order: CreatedOrderResponse };

  return {
    ok: true as const,
    order: body.order,
  };
}

export function buildOrderSuccessHref(order: CreatedOrderResponse): string {
  const params = new URLSearchParams({
    status: order.status,
    totalPrice: String(order.totalPrice),
  });

  return `/order-success/${order.id}?${params.toString()}`;
}

export type CustomerOrderDto = {
  id: number;
  status: string;
  totalPrice: string | number;
  paymentMethod: string;
  createdAt: string;
  estimatedDeliveryTime: string | null;
  restaurant: {
    id: number;
    name: string;
  };
  items: Array<{
    quantity: number;
    priceAtPurchase: string | number;
    meal: {
      id: number;
      name: string;
      image: string | null;
    };
    review: {
      id: number;
      rating: number;
      comment: string | null;
      createdAt: string;
    } | null;
  }>;
};

export async function fetchMyOrders() {
  const response = await fetch("/api/orders", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not load your orders.",
    };
  }

  const body = (await response.json()) as { orders: CustomerOrderDto[] };

  return {
    ok: true as const,
    orders: body.orders,
  };
}

