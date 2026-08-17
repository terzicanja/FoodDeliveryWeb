import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MealList } from "@/components/restaurants/MealList";
import { RestaurantHero } from "@/components/restaurants/RestaurantHero";
import { RestaurantLocation } from "@/components/restaurants/RestaurantLocation";
import { getAuthPayload } from "@/lib/auth-request";
import { geocodeAddress } from "@/lib/geocoding";
import {
  getReviewEligibilityForUser,
  getReviewsForMeals,
} from "@/lib/reviews";
import { getRestaurantById } from "@/lib/restaurants";

type RestaurantPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const restaurantId = Number(id);
  const restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    notFound();
  }

  const { meals, ...restaurantInfo } = restaurant;
  const mealIds = meals.map((meal) => meal.id);
  const auth = await getAuthPayload();

  const [reviewsByMeal, eligibilityByMeal, coordinates] = await Promise.all([
    getReviewsForMeals(mealIds),
    auth?.role === Role.CUSTOMER
      ? getReviewEligibilityForUser(auth.userId, mealIds)
      : Promise.resolve(
          new Map<
            number,
            { canReview: boolean; ownReview: null }
          >(),
        ),
    geocodeAddress(restaurant.address),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          ← Back to restaurants
        </Link>

        <div className="mt-6">
          <RestaurantHero restaurant={restaurantInfo} />
        </div>

        <RestaurantLocation
          name={restaurant.name}
          address={restaurant.address}
          coordinates={coordinates}
        />

        <section className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Menu
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {meals.length} {meals.length === 1 ? "dish" : "dishes"} available
            </p>
          </div>

          <MealList
            meals={meals}
            restaurantId={restaurant.id}
            reviewsByMeal={reviewsByMeal}
            eligibilityByMeal={eligibilityByMeal}
          />
        </section>
      </main>
    </div>
  );
}
