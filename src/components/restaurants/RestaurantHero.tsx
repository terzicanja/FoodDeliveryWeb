import {
  formatRestaurantType,
  type RestaurantDetail,
} from "@/lib/restaurants";

type RestaurantHeroProps = {
  restaurant: Omit<RestaurantDetail, "meals">;
};

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
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

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {restaurant.name}
      </h1>

      <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-600">
        {restaurant.description?.trim()
          ? restaurant.description
          : "No description available."}
      </p>

      <p className="mt-4 text-sm text-zinc-500">{restaurant.address}</p>
    </section>
  );
}
