"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { FormField, TextInput } from "@/components/auth/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  createAdminMeal,
  createAdminRestaurant,
  deleteAdminMeal,
  deleteAdminRestaurant,
  fetchAdminRestaurantMeals,
  fetchAdminRestaurants,
  type AdminMealDto,
  type AdminRestaurantDto,
} from "@/lib/api/admin-client";
import { formatMealPrice } from "@/lib/format";
import {
  mealFormSchema,
  restaurantFormSchema,
  type MealFormInput,
  type RestaurantFormInput,
} from "@/lib/validations/admin";
import {
  formatRestaurantType,
  RESTAURANT_TYPE_OPTIONS,
} from "@/lib/validations/restaurants";

type ViewStatus = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";

function restaurantBlockReason(restaurant: AdminRestaurantDto): string | null {
  const blockers: string[] = [];

  if (restaurant.mealCount > 0) {
    blockers.push("meals");
  }

  if (restaurant.orderCount > 0) {
    blockers.push("orders");
  }

  if (blockers.length === 0) {
    return null;
  }

  return `Cannot delete while related ${blockers.join(", ")} exist.`;
}

function mealBlockReason(meal: AdminMealDto): string | null {
  const blockers: string[] = [];

  if (meal.orderItemCount > 0) {
    blockers.push("order items");
  }

  if (meal.reviewCount > 0) {
    blockers.push("reviews");
  }

  if (blockers.length === 0) {
    return null;
  }

  return `Cannot delete while related ${blockers.join(", ")} exist.`;
}

export function AdminRestaurantsView() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [restaurants, setRestaurants] = useState<AdminRestaurantDto[]>([]);
  const [mealsByRestaurant, setMealsByRestaurant] = useState<
    Record<number, AdminMealDto[]>
  >({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingMealsId, setLoadingMealsId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingRestaurant, setPendingRestaurant] =
    useState<AdminRestaurantDto | null>(null);
  const [pendingMeal, setPendingMeal] = useState<AdminMealDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const restaurantForm = useForm<RestaurantFormInput>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      restaurantTypes: [],
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurants() {
      const result = await fetchAdminRestaurants();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/admin");
          return;
        }

        if (result.status === 403) {
          setStatus("forbidden");
          return;
        }

        setError(result.error);
        setStatus("error");
        return;
      }

      setRestaurants(result.restaurants);
      setStatus("ready");
    }

    void loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadMeals = async (restaurantId: number) => {
    setLoadingMealsId(restaurantId);
    setActionError(null);

    const result = await fetchAdminRestaurantMeals(restaurantId);

    setLoadingMealsId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setMealsByRestaurant((current) => ({
      ...current,
      [restaurantId]: result.meals,
    }));
  };

  const handleToggleRestaurant = async (restaurantId: number) => {
    if (expandedId === restaurantId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(restaurantId);

    if (!mealsByRestaurant[restaurantId]) {
      await loadMeals(restaurantId);
    }
  };

  const onCreateRestaurant = restaurantForm.handleSubmit(async (values) => {
    setActionError(null);
    setSuccess(null);

    const result = await createAdminRestaurant({
      name: values.name,
      description: values.description,
      address: values.address,
      restaurantTypes: values.restaurantTypes,
    });

    if (!result.ok) {
      if (result.details) {
        for (const [field, messages] of Object.entries(result.details)) {
          if (
            messages?.[0] &&
            (field === "name" ||
              field === "description" ||
              field === "address" ||
              field === "restaurantTypes")
          ) {
            restaurantForm.setError(field, { message: messages[0] });
          }
        }
      }

      setActionError(result.error);
      return;
    }

    setRestaurants((current) =>
      [...current, result.restaurant].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
    restaurantForm.reset();
    setShowCreateForm(false);
    setSuccess(`${result.restaurant.name} was added.`);
  });

  const handleDeleteRestaurant = async () => {
    if (!pendingRestaurant || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      const result = await deleteAdminRestaurant(pendingRestaurant.id);

      if (!result.ok) {
        setActionError(result.error);
        setPendingRestaurant(null);
        return;
      }

      setRestaurants((current) =>
        current.filter((restaurant) => restaurant.id !== pendingRestaurant.id),
      );
      setMealsByRestaurant((current) => {
        const next = { ...current };
        delete next[pendingRestaurant.id];
        return next;
      });

      if (expandedId === pendingRestaurant.id) {
        setExpandedId(null);
      }

      setSuccess(`${pendingRestaurant.name} was deleted.`);
      setPendingRestaurant(null);
    } catch {
      setActionError("Could not delete the restaurant.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!pendingMeal || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      const result = await deleteAdminMeal(pendingMeal.id);

      if (!result.ok) {
        setActionError(result.error);
        setPendingMeal(null);
        return;
      }

      setMealsByRestaurant((current) => ({
        ...current,
        [pendingMeal.restaurantId]: (current[pendingMeal.restaurantId] ?? []).filter(
          (meal) => meal.id !== pendingMeal.id,
        ),
      }));
      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === pendingMeal.restaurantId
            ? { ...restaurant, mealCount: Math.max(0, restaurant.mealCount - 1) }
            : restaurant,
        ),
      );
      setSuccess(`${pendingMeal.name} was deleted.`);
      setPendingMeal(null);
    } catch {
      setActionError("Could not delete the meal.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading restaurants..."}
      </div>
    );
  }

  if (status === "forbidden") {
    return <AdminAccessDenied />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">
          {error ?? "Could not load restaurants."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Restaurants
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add restaurants and manage their meals. Historical orders and reviews
            are preserved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setActionError(null);
          }}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          {showCreateForm ? "Cancel" : "Add Restaurant"}
        </button>
      </div>

      {success ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </p>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      {showCreateForm ? (
        <form
          onSubmit={onCreateRestaurant}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-zinc-900">
            New restaurant
          </h3>
          <FormField label="Name" error={restaurantForm.formState.errors.name?.message}>
            <TextInput
              hasError={Boolean(restaurantForm.formState.errors.name)}
              {...restaurantForm.register("name")}
            />
          </FormField>
          <FormField
            label="Description"
            error={restaurantForm.formState.errors.description?.message}
          >
            <textarea
              rows={3}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 ${
                restaurantForm.formState.errors.description
                  ? "border-red-400"
                  : "border-zinc-300"
              }`}
              {...restaurantForm.register("description")}
            />
          </FormField>
          <FormField
            label="Address"
            error={restaurantForm.formState.errors.address?.message}
          >
            <TextInput
              hasError={Boolean(restaurantForm.formState.errors.address)}
              {...restaurantForm.register("address")}
            />
          </FormField>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">
              Restaurant types
            </legend>
            <div className="flex flex-wrap gap-3">
              {RESTAURANT_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex items-center gap-2 text-sm text-zinc-700"
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    {...restaurantForm.register("restaurantTypes")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {restaurantForm.formState.errors.restaurantTypes?.message ? (
              <p className="mt-1.5 text-sm text-red-600">
                {restaurantForm.formState.errors.restaurantTypes.message}
              </p>
            ) : null}
          </fieldset>
          <button
            type="submit"
            disabled={restaurantForm.formState.isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {restaurantForm.formState.isSubmitting
              ? "Creating..."
              : "Create restaurant"}
          </button>
        </form>
      ) : null}

      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            No restaurants yet
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Add a restaurant to start managing meals.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {restaurants.map((restaurant) => {
            const isExpanded = expandedId === restaurant.id;
            const blockReason = restaurantBlockReason(restaurant);
            const meals = mealsByRestaurant[restaurant.id];

            return (
              <li
                key={restaurant.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">
                      {restaurant.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">{restaurant.address}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {restaurant.restaurantTypes.map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800"
                        >
                          {formatRestaurantType(type)}
                        </span>
                      ))}
                    </div>
                    {restaurant.description ? (
                      <p className="mt-2 text-sm text-zinc-600">
                        {restaurant.description}
                      </p>
                    ) : null}
                    {blockReason ? (
                      <p className="mt-2 text-sm text-amber-700">{blockReason}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleToggleRestaurant(restaurant.id);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      {isExpanded ? "Hide meals" : "Manage meals"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(blockReason) || isDeleting}
                      onClick={() => {
                        setActionError(null);
                        setSuccess(null);
                        setPendingRestaurant(restaurant);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 border-t border-zinc-100 pt-5">
                    {loadingMealsId === restaurant.id && !meals ? (
                      <p className="text-sm text-zinc-500">Loading meals...</p>
                    ) : (
                      <RestaurantMealsPanel
                        restaurantId={restaurant.id}
                        meals={meals ?? []}
                        isDeleting={isDeleting}
                        onCreated={(meal) => {
                          setMealsByRestaurant((current) => ({
                            ...current,
                            [restaurant.id]: [...(current[restaurant.id] ?? []), meal].sort(
                              (left, right) => left.name.localeCompare(right.name),
                            ),
                          }));
                          setRestaurants((current) =>
                            current.map((item) =>
                              item.id === restaurant.id
                                ? { ...item, mealCount: item.mealCount + 1 }
                                : item,
                            ),
                          );
                          setSuccess(`${meal.name} was added.`);
                          setActionError(null);
                        }}
                        onCreateError={setActionError}
                        onDelete={(meal) => {
                          setActionError(null);
                          setSuccess(null);
                          setPendingMeal(meal);
                        }}
                      />
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingRestaurant !== null}
        title="Delete restaurant?"
        description={
          pendingRestaurant
            ? `Delete ${pendingRestaurant.name}? This cannot be undone.`
            : ""
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={() => {
          void handleDeleteRestaurant();
        }}
        onCancel={() => {
          if (!isDeleting) {
            setPendingRestaurant(null);
          }
        }}
      />

      <ConfirmDialog
        open={pendingMeal !== null}
        title="Delete meal?"
        description={
          pendingMeal
            ? `Delete ${pendingMeal.name}? This cannot be undone.`
            : ""
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={() => {
          void handleDeleteMeal();
        }}
        onCancel={() => {
          if (!isDeleting) {
            setPendingMeal(null);
          }
        }}
      />
    </div>
  );
}

function RestaurantMealsPanel({
  restaurantId,
  meals,
  isDeleting,
  onCreated,
  onCreateError,
  onDelete,
}: {
  restaurantId: number;
  meals: AdminMealDto[];
  isDeleting: boolean;
  onCreated: (meal: AdminMealDto) => void;
  onCreateError: (message: string) => void;
  onDelete: (meal: AdminMealDto) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const mealForm = useForm<MealFormInput>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      images: [""],
    },
  });
  const imageValues = mealForm.watch("images");

  const onCreateMeal = mealForm.handleSubmit(async (values) => {
    const result = await createAdminMeal(restaurantId, {
      name: values.name,
      description: values.description,
      price: values.price,
      images: values.images,
    });

    if (!result.ok) {
      if (result.details) {
        for (const [field, messages] of Object.entries(result.details)) {
          if (
            messages?.[0] &&
            (field === "name" ||
              field === "description" ||
              field === "price" ||
              field === "images")
          ) {
            mealForm.setError(field, { message: messages[0] });
          }
        }
      }

      onCreateError(result.error);
      return;
    }

    mealForm.reset({
      name: "",
      description: "",
      price: 0,
      images: [""],
    });
    setShowForm(false);
    onCreated(result.meal);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Meals
        </h3>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          {showForm ? "Cancel" : "Add Meal"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onCreateMeal} className="space-y-3 rounded-xl bg-zinc-50 p-4">
          <FormField label="Name" error={mealForm.formState.errors.name?.message}>
            <TextInput
              hasError={Boolean(mealForm.formState.errors.name)}
              {...mealForm.register("name")}
            />
          </FormField>
          <FormField
            label="Description"
            error={mealForm.formState.errors.description?.message}
          >
            <textarea
              rows={2}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 ${
                mealForm.formState.errors.description
                  ? "border-red-400"
                  : "border-zinc-300"
              }`}
              {...mealForm.register("description")}
            />
          </FormField>
          <FormField label="Price" error={mealForm.formState.errors.price?.message}>
            <TextInput
              type="number"
              step="0.01"
              min="0.01"
              hasError={Boolean(mealForm.formState.errors.price)}
              {...mealForm.register("price", { valueAsNumber: true })}
            />
          </FormField>
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Image URLs</p>
            {imageValues.map((_value, index) => (
              <div key={index} className="flex gap-2">
                <TextInput
                  placeholder="https://..."
                  hasError={Boolean(mealForm.formState.errors.images?.[index])}
                  {...mealForm.register(`images.${index}`)}
                />
                {imageValues.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      mealForm.setValue(
                        "images",
                        imageValues.filter((_, imageIndex) => imageIndex !== index),
                      );
                    }}
                    className="inline-flex h-10 shrink-0 items-center rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 hover:bg-white"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {mealForm.formState.errors.images?.message ||
            mealForm.formState.errors.images?.root?.message ? (
              <p className="text-sm text-red-600">
                {mealForm.formState.errors.images.message ??
                  mealForm.formState.errors.images.root?.message}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                mealForm.setValue("images", [...imageValues, ""]);
              }}
              className="text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              Add image URL
            </button>
          </div>
          <button
            type="submit"
            disabled={mealForm.formState.isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {mealForm.formState.isSubmitting ? "Creating..." : "Create meal"}
          </button>
        </form>
      ) : null}

      {meals.length === 0 ? (
        <p className="text-sm text-zinc-500">No meals yet.</p>
      ) : (
        <ul className="space-y-3">
          {meals.map((meal) => {
            const blockReason = mealBlockReason(meal);

            return (
              <li
                key={meal.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {meal.name}{" "}
                      <span className="font-normal text-zinc-500">
                        · {formatMealPrice(meal.price)}
                      </span>
                    </p>
                    {meal.description ? (
                      <p className="mt-1 text-sm text-zinc-600">{meal.description}</p>
                    ) : null}
                    {meal.images.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {meal.images.map((url) => (
                          <li
                            key={url}
                            className="truncate text-xs text-zinc-400"
                            title={url}
                          >
                            {url}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {blockReason ? (
                      <p className="mt-2 text-sm text-amber-700">{blockReason}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(blockReason) || isDeleting}
                    onClick={() => onDelete(meal)}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
