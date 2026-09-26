import { RestaurantType } from "@prisma/client";
import { parseApiError } from "@/lib/api/auth-client";
import type { CreateMealInput } from "@/lib/validations/restaurant";

export type RestaurantProfileDto = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  imageUrl: string | null;
  restaurantTypes: RestaurantType[];
};

export type RestaurantMealDto = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  restaurantId: number;
  createdAt: string;
  updatedAt: string;
  orderItemCount: number;
  reviewCount: number;
};

export type RestaurantOrderDto = {
  id: number;
  status: string;
  fulfillmentType: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: string | number;
  orderAddress: string;
  estimatedDeliveryTime: number | null;
  note: string | null;
  failureNote: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    quantity: number;
    priceAtPurchase: string | number;
    meal: {
      id: number;
      name: string;
    };
  }>;
};

type ApiFailure = {
  ok: false;
  status: number;
  error: string;
  details?: Record<string, string[] | undefined>;
};

async function toFailure(
  response: Response,
  fallback: string,
): Promise<ApiFailure> {
  const body = await parseApiError(response);

  return {
    ok: false,
    status: response.status,
    error: body.error ?? fallback,
    details: body.details,
  };
}

export async function fetchRestaurantProfile() {
  const response = await fetch("/api/restaurant/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load restaurant profile.");
  }

  const body = (await response.json()) as { restaurant: RestaurantProfileDto };

  return {
    ok: true as const,
    restaurant: body.restaurant,
  };
}

export async function fetchRestaurantMeals() {
  const response = await fetch("/api/restaurant/meals", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load meals.");
  }

  const body = (await response.json()) as { meals: RestaurantMealDto[] };

  return {
    ok: true as const,
    meals: body.meals,
  };
}

export async function createRestaurantMeal(data: CreateMealInput) {
  const response = await fetch("/api/restaurant/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return toFailure(response, "Could not create the meal.");
  }

  const body = (await response.json()) as { meal: RestaurantMealDto };

  return {
    ok: true as const,
    meal: body.meal,
  };
}

export async function updateRestaurantMeal(
  mealId: number,
  data: CreateMealInput,
) {
  const response = await fetch(`/api/restaurant/meals/${mealId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return toFailure(response, "Could not update the meal.");
  }

  const body = (await response.json()) as { meal: RestaurantMealDto };

  return {
    ok: true as const,
    meal: body.meal,
  };
}

export async function deleteRestaurantMeal(mealId: number) {
  const response = await fetch(`/api/restaurant/meals/${mealId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    return toFailure(response, "Could not delete the meal.");
  }

  return { ok: true as const };
}

export async function fetchRestaurantOrders() {
  const response = await fetch("/api/restaurant/orders", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load orders.");
  }

  const body = (await response.json()) as { orders: RestaurantOrderDto[] };

  return {
    ok: true as const,
    orders: body.orders,
  };
}

export async function acceptRestaurantOrder(
  orderId: number,
  estimatedDeliveryTime: number,
) {
  const response = await fetch(`/api/restaurant/orders/${orderId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ estimatedDeliveryTime }),
  });

  if (!response.ok) {
    return toFailure(response, "Could not accept the order.");
  }

  const body = (await response.json()) as { order: RestaurantOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}

export async function rejectRestaurantOrder(orderId: number) {
  const response = await fetch(`/api/restaurant/orders/${orderId}/reject`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return toFailure(response, "Could not reject the order.");
  }

  const body = (await response.json()) as { order: RestaurantOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}

export async function updateRestaurantOrderStatus(
  orderId: number,
  status: "PREPARING" | "READY" | "PICKED_UP",
) {
  const response = await fetch(`/api/restaurant/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    return toFailure(response, "Could not update the order status.");
  }

  const body = (await response.json()) as { order: RestaurantOrderDto };

  return {
    ok: true as const,
    order: body.order,
  };
}
