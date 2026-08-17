import { RestaurantType } from "@prisma/client";

export const RESTAURANT_SORTS = [
  "name-asc",
  "name-desc",
  "rating-desc",
  "rating-asc",
] as const;

export type RestaurantSort = (typeof RESTAURANT_SORTS)[number];

export const DEFAULT_RESTAURANT_SORT: RestaurantSort = "name-asc";

export const RESTAURANT_SORT_OPTIONS: ReadonlyArray<{
  value: RestaurantSort;
  label: string;
}> = [
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "rating-desc", label: "Rating: highest first" },
  { value: "rating-asc", label: "Rating: lowest first" },
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
};

export type RestaurantQueryInput = {
  search?: string | string[] | null;
  type?: string | string[] | null;
  sort?: string | string[] | null;
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

/**
 * Normalize homepage/API query params.
 * Invalid sort → name-asc. Invalid type → no type filter.
 */
export function parseRestaurantQuery(
  input: RestaurantQueryInput,
): RestaurantQuery {
  const search = firstString(input.search);
  const type = parseRestaurantType(firstString(input.type));
  const sort = parseRestaurantSort(firstString(input.sort));

  return {
    ...(search ? { search } : {}),
    ...(type ? { type } : {}),
    sort,
  };
}

export function isRestaurantQueryActive(query: RestaurantQuery): boolean {
  return Boolean(
    query.search || query.type || query.sort !== DEFAULT_RESTAURANT_SORT,
  );
}

export function buildRestaurantSearchParams(query: {
  search?: string;
  type?: string;
  sort?: string;
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

  return params;
}

export function restaurantQueryHref(query: {
  search?: string;
  type?: string;
  sort?: string;
}): string {
  const params = buildRestaurantSearchParams(query);
  const serialized = params.toString();
  return serialized ? `/?${serialized}` : "/";
}
