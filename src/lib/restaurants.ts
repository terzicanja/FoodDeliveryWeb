import { RestaurantType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  EMPTY_RATING_SUMMARY,
  getMealRatingSummaries,
  getRestaurantRating,
  getRestaurantRatings,
  type RatingSummary,
} from "@/lib/reviews";
import {
  DEFAULT_RESTAURANT_SORT,
  formatRestaurantType,
  RESTAURANT_TYPE_OPTIONS,
  type RestaurantSort,
} from "@/lib/validations/restaurants";

export { formatRestaurantType };

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
}> &
  RatingSummary;

export type MealListItem = Prisma.MealGetPayload<{
  select: typeof mealListSelect;
}>;

export type MealWithRating = MealListItem & RatingSummary;

export type RestaurantDetail = Omit<RestaurantListItem, keyof RatingSummary> &
  RatingSummary & {
    meals: MealWithRating[];
  };

export type RestaurantQueryOptions = {
  search?: string;
  restaurantType?: RestaurantType;
  sort?: RestaurantSort;
};

function compareRestaurantsByRating(
  left: RestaurantListItem,
  right: RestaurantListItem,
  direction: "asc" | "desc",
): number {
  const leftRating = left.averageRating;
  const rightRating = right.averageRating;

  if (leftRating == null && rightRating == null) {
    return left.name.localeCompare(right.name);
  }

  // Unrated restaurants always sort after rated ones.
  if (leftRating == null) {
    return 1;
  }

  if (rightRating == null) {
    return -1;
  }

  const diff =
    direction === "desc"
      ? rightRating - leftRating
      : leftRating - rightRating;

  if (diff !== 0) {
    return diff;
  }

  return left.name.localeCompare(right.name);
}

/**
 * Fetch restaurants for listing views / public API.
 * Search matches name and description (case-insensitive, partial).
 * Type filter matches restaurants that include the selected type.
 * Name sorting is done in the database. Rating sorting uses calculated
 * meal-review averages and keeps unrated restaurants after rated ones.
 */
export async function getRestaurants(
  options: RestaurantQueryOptions = {},
): Promise<RestaurantListItem[]> {
  const search = options.search?.trim() ?? "";
  const sort = options.sort ?? DEFAULT_RESTAURANT_SORT;
  const nameDirection = sort === "name-desc" ? "desc" : "asc";

  const where: Prisma.RestaurantWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (options.restaurantType) {
    where.restaurantTypes = { has: options.restaurantType };
  }

  const restaurants = await prisma.restaurant.findMany({
    where,
    select: restaurantListSelect,
    orderBy: { name: nameDirection },
  });

  const ratings = await getRestaurantRatings(
    restaurants.map((restaurant) => restaurant.id),
  );

  const withRatings = restaurants.map((restaurant) => ({
    ...restaurant,
    ...(ratings.get(restaurant.id) ?? EMPTY_RATING_SUMMARY),
  }));

  if (sort === "rating-desc") {
    return [...withRatings].sort((left, right) =>
      compareRestaurantsByRating(left, right, "desc"),
    );
  }

  if (sort === "rating-asc") {
    return [...withRatings].sort((left, right) =>
      compareRestaurantsByRating(left, right, "asc"),
    );
  }

  return withRatings;
}

export function getRestaurantTypeOptions(): Array<{
  value: RestaurantType;
  label: string;
}> {
  return RESTAURANT_TYPE_OPTIONS;
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

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      ...restaurantListSelect,
      meals: {
        select: mealListSelect,
        orderBy: { name: "asc" },
      },
    },
  });

  if (!restaurant) {
    return null;
  }

  const mealIds = restaurant.meals.map((meal) => meal.id);
  const [restaurantRating, mealRatings] = await Promise.all([
    getRestaurantRating(id),
    getMealRatingSummaries(mealIds),
  ]);

  return {
    ...restaurant,
    ...restaurantRating,
    meals: restaurant.meals.map((meal) => ({
      ...meal,
      ...(mealRatings.get(meal.id) ?? EMPTY_RATING_SUMMARY),
    })),
  };
}

export { formatMealPrice } from "@/lib/format";
