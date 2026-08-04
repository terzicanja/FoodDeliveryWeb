import Image from "next/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatMealPrice, type MealListItem } from "@/lib/restaurants";

type MealCardProps = {
  meal: MealListItem;
  restaurantId: number;
};

export function MealCard({ meal, restaurantId }: MealCardProps) {
  const imageUrl = meal.images[0] ?? null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="h-44 w-full shrink-0 overflow-hidden bg-zinc-100 sm:h-48">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={meal.name}
            width={800}
            height={600}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            {meal.name}
          </h3>
          <p className="shrink-0 text-sm font-semibold text-orange-700">
            {formatMealPrice(meal.price)}
          </p>
        </div>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
          {meal.description?.trim()
            ? meal.description
            : "No description available."}
        </p>

        <AddToCartButton
          item={{
            mealId: meal.id,
            restaurantId,
            name: meal.name,
            price: Number(meal.price),
            image: imageUrl,
          }}
        />
      </div>
    </article>
  );
}
