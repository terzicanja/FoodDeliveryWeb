import { RestaurantType } from "@prisma/client";
import { isValidCoordinates, type GeoCoordinates } from "@/lib/geocoding";

export const RESTAURANT_SORTS = [
  "name-asc",
  "name-desc",
  "rating-desc",
  "rating-asc",
  "distance",
] as const;

export type RestaurantSort = (typeof RESTAURANT_SORTS)[number];

export const DEFAULT_RESTAURANT_SORT: RestaurantSort = "name-asc";
export const DISTANCE_SORT: RestaurantSort = "distance";

export const RESTAURANT_SORT_OPTIONS: ReadonlyArray<{
  value: RestaurantSort;
  label: string;
}> = [
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "rating-desc", label: "Rating: highest first" },
  { value: "rating-asc", label: "Rating: lowest first" },
  { value: "distance", label: "Near Me" },
];

const RESTAURANT_TYPE_LABELS: Record<RestaurantType, string> = {
  ITALIAN: "Italian",
  MEXICAN: "Mexican",
  FAST_FOOD: "Fast Food",
  CHINESE: "Chinese",
  INDIAN: "Indian",
};

export const RESTAURANT_TYPE_OPTIONS = (
  Object.values(RestaurantType) as RestaurantType[]
).map((type) => ({
  value: type,
  label: RESTAURANT_TYPE_LABELS[type],
}));

export function formatRestaurantType(type: RestaurantType): string {
  return RESTAURANT_TYPE_LABELS[type] ?? type;
}

const RESTAURANT_TYPE_VALUES = new Set<string>(Object.values(RestaurantType));

export type RestaurantQuery = {
  search?: string;
  type?: RestaurantType;
  sort: RestaurantSort;
  /**
   * Origin for Near Me sorting. Only set when sort=distance and coords are valid.
   */
  origin?: GeoCoordinates;
};

export type RestaurantQueryInput = {
  search?: string | string[] | null;
  type?: string | string[] | null;
  sort?: string | string[] | null;
  lat?: string | string[] | null;
  lng?: string | string[] | null;
};

function firstString(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function parseRestaurantType(value: string): RestaurantType | undefined {
  if (!value || !RESTAURANT_TYPE_VALUES.has(value)) {
    return undefined;
  }

  return value as RestaurantType;
}

function parseRestaurantSort(value: string): RestaurantSort {
  return RESTAURANT_SORTS.includes(value as RestaurantSort)
    ? (value as RestaurantSort)
    : DEFAULT_RESTAURANT_SORT;
}

function parseCoordinate(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Parse optional lat/lng query params into validated WGS84 coordinates.
 */
export function parseOriginCoordinates(input: {
  lat?: string | string[] | null;
  lng?: string | string[] | null;
}): GeoCoordinates | undefined {
  const latitude = parseCoordinate(firstString(input.lat));
  const longitude = parseCoordinate(firstString(input.lng));

  if (latitude == null || longitude == null) {
    return undefined;
  }

  const coordinates = { latitude, longitude };

  return isValidCoordinates(coordinates) ? coordinates : undefined;
}

/**
 * Normalize homepage/API query params.
 * Invalid sort → name-asc. Invalid type → no type filter.
 * sort=distance without valid lat/lng keeps sort=distance but omits origin
 * (caller falls back to default name ordering).
 */
export function parseRestaurantQuery(
  input: RestaurantQueryInput,
): RestaurantQuery {
  const search = firstString(input.search);
  const type = parseRestaurantType(firstString(input.type));
  const sort = parseRestaurantSort(firstString(input.sort));
  const origin =
    sort === DISTANCE_SORT ? parseOriginCoordinates(input) : undefined;

  return {
    ...(search ? { search } : {}),
    ...(type ? { type } : {}),
    sort,
    ...(origin ? { origin } : {}),
  };
}

export function isRestaurantQueryActive(query: RestaurantQuery): boolean {
  return Boolean(
    query.search ||
      query.type ||
      query.sort !== DEFAULT_RESTAURANT_SORT ||
      query.origin,
  );
}

export function buildRestaurantSearchParams(query: {
  search?: string;
  type?: string;
  sort?: string;
  lat?: number | string | null;
  lng?: number | string | null;
}): URLSearchParams {
  const params = new URLSearchParams();
  const search = query.search?.trim() ?? "";
  const type = query.type?.trim() ?? "";
  const sort = parseRestaurantSort(query.sort?.trim() ?? "");

  if (search) {
    params.set("search", search);
  }

  if (type && RESTAURANT_TYPE_VALUES.has(type)) {
    params.set("type", type);
  }

  if (sort !== DEFAULT_RESTAURANT_SORT) {
    params.set("sort", sort);
  }

  if (sort === DISTANCE_SORT) {
    const origin = parseOriginCoordinates({
      lat: query.lat == null ? null : String(query.lat),
      lng: query.lng == null ? null : String(query.lng),
    });

    if (origin) {
      params.set("lat", String(origin.latitude));
      params.set("lng", String(origin.longitude));
    }
  }

  return params;
}

export function restaurantQueryHref(query: {
  search?: string;
  type?: string;
  sort?: string;
  lat?: number | string | null;
  lng?: number | string | null;
}): string {
  const params = buildRestaurantSearchParams(query);
  const serialized = params.toString();
  return serialized ? `/?${serialized}` : "/";
}
