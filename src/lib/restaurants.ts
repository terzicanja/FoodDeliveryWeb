import type { Prisma, RestaurantType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const restaurantListSelect = {
  id: true,
  name: true,
  description: true,
  address: true,
  restaurantTypes: true,
} satisfies Prisma.RestaurantSelect;

export const mealListSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  images: true,
} satisfies Prisma.MealSelect;

export type RestaurantListItem = Prisma.RestaurantGetPayload<{
  select: typeof restaurantListSelect;
}>;

export type MealListItem = Prisma.MealGetPayload<{
  select: typeof mealListSelect;
}>;

export type RestaurantDetail = RestaurantListItem & {
  meals: MealListItem[];
};

/**
 * Fetch all restaurants for listing views / public API.
 * Sorted alphabetically by name. Meals are intentionally omitted.
 */
export async function getRestaurants(): Promise<RestaurantListItem[]> {
  return prisma.restaurant.findMany({
    select: restaurantListSelect,
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch a single restaurant with its meals.
 * Returns `null` when the id is invalid or the restaurant does not exist.
 */
export async function getRestaurantById(
  id: number,
): Promise<RestaurantDetail | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return prisma.restaurant.findUnique({
    where: { id },
    select: {
      ...restaurantListSelect,
      meals: {
        select: mealListSelect,
        orderBy: { name: "asc" },
      },
    },
  });
}

const RESTAURANT_TYPE_LABELS: Record<RestaurantType, string> = {
  ITALIAN: "Italian",
  MEXICAN: "Mexican",
  FAST_FOOD: "Fast Food",
  CHINESE: "Chinese",
  INDIAN: "Indian",
};

export function formatRestaurantType(type: RestaurantType): string {
  return RESTAURANT_TYPE_LABELS[type] ?? type;
}

export function formatMealPrice(
  price: MealListItem["price"] | number | string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(Number(price));
}
