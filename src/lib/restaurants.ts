import { RestaurantType, type Prisma } from "@prisma/client";
import type { GeoCoordinates } from "@/lib/geocoding";
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
  DISTANCE_SORT,
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
  latitude: true,
  longitude: true,
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
  RatingSummary & {
    /**
     * Present only when listing with Near Me sort and a valid origin.
     * Null when the restaurant has no usable coordinates.
     */
    distanceKm?: number | null;
  };

export type MealListItem = Prisma.MealGetPayload<{
  select: typeof mealListSelect;
}>;

export type MealWithRating = MealListItem & RatingSummary;

export type RestaurantDetail = Omit<RestaurantListItem, keyof RatingSummary | "distanceKm"> &
  RatingSummary & {
    meals: MealWithRating[];
  };

export type RestaurantQueryOptions = {
  search?: string;
  restaurantType?: RestaurantType;
  sort?: RestaurantSort;
  /**
   * Required for sort=distance. When missing, distance sort falls back to name-asc.
   */
  origin?: GeoCoordinates;
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

type DistanceQueryRow = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  restaurantTypes: RestaurantType[];
  distance_km: number | null;
};

/**
 * Order filtered restaurants by Haversine distance in PostgreSQL.
 * Restaurants without valid coordinates sort last (NULLS LAST), then by name.
 * Filters are applied before ordering so this remains correct if pagination is added later.
 */
async function getRestaurantsOrderedByDistance(params: {
  search: string;
  restaurantType?: RestaurantType;
  origin: GeoCoordinates;
}): Promise<Array<Prisma.RestaurantGetPayload<{ select: typeof restaurantListSelect }> & { distanceKm: number | null }>> {
  const { search, restaurantType, origin } = params;

  const rows = await prisma.$queryRaw<DistanceQueryRow[]>`
    SELECT
      r.id,
      r.name,
      r.description,
      r.address,
      r.latitude,
      r.longitude,
      r."restaurantTypes",
      CASE
        WHEN r.latitude IS NULL OR r.longitude IS NULL THEN NULL
        ELSE (
          6371 * acos(
            LEAST(
              1.0,
              GREATEST(
                -1.0,
                cos(radians(${origin.latitude})) * cos(radians(r.latitude))
                  * cos(radians(r.longitude) - radians(${origin.longitude}))
                  + sin(radians(${origin.latitude})) * sin(radians(r.latitude))
              )
            )
          )
        )
      END AS distance_km
    FROM "Restaurant" AS r
    WHERE
      (
        ${search}::text = ''
        OR r.name ILIKE ('%' || ${search} || '%')
        OR COALESCE(r.description, '') ILIKE ('%' || ${search} || '%')
      )
      AND (
        ${restaurantType ?? null}::"RestaurantType" IS NULL
        OR ${restaurantType ?? null}::"RestaurantType" = ANY (r."restaurantTypes")
      )
    ORDER BY
      distance_km ASC NULLS LAST,
      r.name ASC
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    restaurantTypes: row.restaurantTypes,
    distanceKm:
      row.distance_km == null || !Number.isFinite(row.distance_km)
        ? null
        : row.distance_km,
  }));
}

/**
 * Fetch restaurants for listing views / public API.
 * Search matches name and description (case-insensitive, partial).
 * Type filter matches restaurants that include the selected type.
 * Name sorting is done in the database. Rating sorting uses calculated
 * meal-review averages and keeps unrated restaurants after rated ones.
 * Distance ("Near Me") sorting uses Haversine in PostgreSQL when origin
 * coordinates are provided; restaurants without coordinates sort last.
 * Without a valid origin, distance sort falls back to name-asc.
 */
export async function getRestaurants(
  options: RestaurantQueryOptions = {},
): Promise<RestaurantListItem[]> {
  const search = options.search?.trim() ?? "";
  const sort = options.sort ?? DEFAULT_RESTAURANT_SORT;
  const nameDirection = sort === "name-desc" ? "desc" : "asc";
  const useDistanceSort = sort === DISTANCE_SORT && options.origin != null;

  if (useDistanceSort && options.origin) {
    const restaurants = await getRestaurantsOrderedByDistance({
      search,
      restaurantType: options.restaurantType,
      origin: options.origin,
    });

    const ratings = await getRestaurantRatings(
      restaurants.map((restaurant) => restaurant.id),
    );

    return restaurants.map((restaurant) => ({
      ...restaurant,
      ...(ratings.get(restaurant.id) ?? EMPTY_RATING_SUMMARY),
    }));
  }

  const effectiveSort =
    sort === DISTANCE_SORT ? DEFAULT_RESTAURANT_SORT : sort;
  const effectiveNameDirection =
    effectiveSort === "name-desc" ? "desc" : nameDirection;

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
    orderBy: { name: effectiveNameDirection },
  });

  const ratings = await getRestaurantRatings(
    restaurants.map((restaurant) => restaurant.id),
  );

  const withRatings = restaurants.map((restaurant) => ({
    ...restaurant,
    ...(ratings.get(restaurant.id) ?? EMPTY_RATING_SUMMARY),
  }));

  if (effectiveSort === "rating-desc") {
    return [...withRatings].sort((left, right) =>
      compareRestaurantsByRating(left, right, "desc"),
    );
  }

  if (effectiveSort === "rating-asc") {
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
