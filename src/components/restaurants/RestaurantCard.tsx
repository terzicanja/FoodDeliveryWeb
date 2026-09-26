import Link from "next/link";
import { RatingSummaryDisplay } from "@/components/reviews/RatingSummary";
import { formatDistanceKm } from "@/lib/geo-distance";
import {
  formatRestaurantType,
  type RestaurantListItem,
} from "@/lib/restaurants";

type RestaurantCardProps = {
  restaurant: RestaurantListItem;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
    >
      <div className="flex flex-wrap gap-2">
        {restaurant.restaurantTypes.map((type) => (
          <span
            key={type}
            className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
          >
            {formatRestaurantType(type)}
          </span>
        ))}
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 transition group-hover:text-orange-700">
        {restaurant.name}
      </h2>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
        {restaurant.description?.trim()
          ? restaurant.description
          : "No description available."}
      </p>

      <p className="mt-4 text-sm text-zinc-500">{restaurant.address}</p>
      {restaurant.distanceKm != null ? (
        <p className="mt-1 text-sm font-medium text-orange-700">
          {formatDistanceKm(restaurant.distanceKm)}
        </p>
      ) : null}

      <div className="mt-3">
        <RatingSummaryDisplay
          averageRating={restaurant.averageRating}
          reviewCount={restaurant.reviewCount}
        />
      </div>
    </Link>
  );
}
