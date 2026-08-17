import { parseApiError } from "@/lib/api/auth-client";
import type { RestaurantType, Role } from "@prisma/client";

export type AdminUserDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  role: Role;
  createdAt: string;
  isSelf: boolean;
  customerOrderCount: number;
  reviewCount: number;
  courierOrderCount: number;
};

export type AdminRestaurantDto = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  restaurantTypes: RestaurantType[];
  createdAt: string;
  mealCount: number;
  orderCount: number;
};

export type AdminMealDto = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  restaurantId: number;
  orderItemCount: number;
  reviewCount: number;
};

type AdminApiFailure = {
  ok: false;
  status: number;
  error: string;
  details?: Record<string, string[] | undefined>;
};

async function toFailure(response: Response, fallback: string): Promise<AdminApiFailure> {
  const body = await parseApiError(response);

  return {
    ok: false,
    status: response.status,
    error: body.error ?? fallback,
    details: body.details,
  };
}

export async function fetchAdminUsers() {
  const response = await fetch("/api/admin/users", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load users.");
  }

  const body = (await response.json()) as { users: AdminUserDto[] };

  return {
    ok: true as const,
    users: body.users,
  };
}

export async function deleteAdminUser(userId: number) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    return toFailure(response, "Could not delete the user.");
  }

  return { ok: true as const };
}

export async function fetchAdminRestaurants() {
  const response = await fetch("/api/admin/restaurants", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load restaurants.");
  }

  const body = (await response.json()) as { restaurants: AdminRestaurantDto[] };

  return {
    ok: true as const,
    restaurants: body.restaurants,
  };
}

export async function createAdminRestaurant(data: unknown) {
  const response = await fetch("/api/admin/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return toFailure(response, "Could not create the restaurant.");
  }

  const body = (await response.json()) as { restaurant: AdminRestaurantDto };

  return {
    ok: true as const,
    restaurant: body.restaurant,
  };
}

export async function deleteAdminRestaurant(restaurantId: number) {
  const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    return toFailure(response, "Could not delete the restaurant.");
  }

  return { ok: true as const };
}

export async function fetchAdminRestaurantMeals(restaurantId: number) {
  const response = await fetch(`/api/admin/restaurants/${restaurantId}/meals`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return toFailure(response, "Could not load meals.");
  }

  const body = (await response.json()) as { meals: AdminMealDto[] };

  return {
    ok: true as const,
    meals: body.meals,
  };
}

export async function createAdminMeal(restaurantId: number, data: unknown) {
  const response = await fetch(`/api/admin/restaurants/${restaurantId}/meals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return toFailure(response, "Could not create the meal.");
  }

  const body = (await response.json()) as { meal: AdminMealDto };

  return {
    ok: true as const,
    meal: body.meal,
  };
}

export async function deleteAdminMeal(mealId: number) {
  const response = await fetch(`/api/admin/meals/${mealId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    return toFailure(response, "Could not delete the meal.");
  }

  return { ok: true as const };
}
