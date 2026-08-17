import Link from "next/link";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import type { RestaurantListItem } from "@/lib/restaurants";

type RestaurantListProps = {
  restaurants: RestaurantListItem[];
  hasActiveFilters?: boolean;
};

export function RestaurantList({
  restaurants,
  hasActiveFilters = false,
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            No restaurants found.
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Try a different search, type, or sort, or clear your filters.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Clear filters
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">
          No restaurants yet
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Check back soon — new places to order from are on the way.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => (
        <li key={restaurant.id}>
          <RestaurantCard restaurant={restaurant} />
        </li>
      ))}
    </ul>
  );
}
