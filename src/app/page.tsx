import { SiteHeader } from "@/components/layout/SiteHeader";
import { RestaurantList } from "@/components/restaurants/RestaurantList";
import { getRestaurants } from "@/lib/restaurants";

export default async function HomePage() {
  // Server Component: query the database directly during the request (SSR).
  const restaurants = await getRestaurants();

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

        <RestaurantList restaurants={restaurants} />
      </main>
    </div>
  );
}
