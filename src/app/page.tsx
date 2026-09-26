import { SiteHeader } from "@/components/layout/SiteHeader";
import { RestaurantFilters } from "@/components/restaurants/RestaurantFilters";
import { RestaurantList } from "@/components/restaurants/RestaurantList";
import {
  getRestaurants,
  getRestaurantTypeOptions,
} from "@/lib/restaurants";
import {
  isRestaurantQueryActive,
  parseRestaurantQuery,
} from "@/lib/validations/restaurants";

type HomePageProps = {
  searchParams: Promise<{
    search?: string;
    type?: string;
    sort?: string;
    lat?: string;
    lng?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;
  const query = parseRestaurantQuery(rawParams);
  const isActive = isRestaurantQueryActive(query);

  const restaurants = await getRestaurants({
    search: query.search,
    restaurantType: query.type,
    sort: query.sort,
    origin: query.origin,
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Restaurants near you
          </h1>
          <p className="mt-3 text-base text-zinc-600">
            Browse local spots and order your next meal for delivery.
          </p>
        </div>

        <div className="mb-8">
          <RestaurantFilters
            key={`${query.search ?? ""}-${query.type ?? ""}-${query.sort}-${query.origin?.latitude ?? ""}-${query.origin?.longitude ?? ""}`}
            search={query.search ?? ""}
            type={query.type ?? ""}
            sort={query.sort}
            lat={query.origin?.latitude}
            lng={query.origin?.longitude}
            typeOptions={getRestaurantTypeOptions()}
            isActive={isActive}
          />
        </div>

        <RestaurantList restaurants={restaurants} hasActiveFilters={isActive} />
      </main>
    </div>
  );
}
