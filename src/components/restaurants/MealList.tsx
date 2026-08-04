import { MealCard } from "@/components/restaurants/MealCard";
import type { MealListItem } from "@/lib/restaurants";

type MealListProps = {
  meals: MealListItem[];
  restaurantId: number;
};

export function MealList({ meals, restaurantId }: MealListProps) {
  if (meals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">No meals yet</h2>
        <p className="mt-2 text-sm text-zinc-500">
          This restaurant hasn&apos;t added any dishes to the menu.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <li key={meal.id}>
          <MealCard meal={meal} restaurantId={restaurantId} />
        </li>
      ))}
    </ul>
  );
}
