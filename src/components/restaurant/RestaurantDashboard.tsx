"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField, TextInput } from "@/components/auth/FormField";
import { RestaurantAccessDenied } from "@/components/restaurant/RestaurantAccessDenied";
import { RestaurantOrderCard } from "@/components/restaurant/RestaurantOrderCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  acceptRestaurantOrder,
  createRestaurantMeal,
  deleteRestaurantMeal,
  fetchRestaurantMeals,
  fetchRestaurantOrders,
  fetchRestaurantProfile,
  rejectRestaurantOrder,
  updateRestaurantMeal,
  updateRestaurantOrderStatus,
  type RestaurantMealDto,
  type RestaurantOrderDto,
  type RestaurantProfileDto,
} from "@/lib/api/restaurant-client";
import { formatMealPrice } from "@/lib/format";
import { formatRestaurantType } from "@/lib/validations/restaurants";
import {
  mealFormSchema,
  type MealFormInput,
} from "@/lib/validations/restaurant";

type ViewStatus =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "error";

const ACTIVE_ORDER_STATUSES = new Set([
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
]);

const STATUS_SECTION_ORDER = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "PICKED_UP",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
  "FAILED",
] as const;

function emptyMealForm(): MealFormInput {
  return {
    name: "",
    description: "",
    price: 0,
    images: [],
  };
}

export function RestaurantDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [restaurant, setRestaurant] = useState<RestaurantProfileDto | null>(
    null,
  );
  const [meals, setMeals] = useState<RestaurantMealDto[]>([]);
  const [orders, setOrders] = useState<RestaurantOrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderActionErrors, setOrderActionErrors] = useState<
    Record<number, string>
  >({});
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<RestaurantMealDto | null>(
    null,
  );
  const [pendingDeleteMeal, setPendingDeleteMeal] =
    useState<RestaurantMealDto | null>(null);
  const [isDeletingMeal, setIsDeletingMeal] = useState(false);
  const [imagesText, setImagesText] = useState("");

  const mealForm = useForm<MealFormInput>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: emptyMealForm(),
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const [profileResult, mealsResult, ordersResult] = await Promise.all([
        fetchRestaurantProfile(),
        fetchRestaurantMeals(),
        fetchRestaurantOrders(),
      ]);

      if (cancelled) {
        return;
      }

      const firstFailure = [profileResult, mealsResult, ordersResult].find(
        (result) => !result.ok,
      );

      if (firstFailure && !firstFailure.ok) {
        if (firstFailure.status === 401) {
          setStatus("unauthenticated");
          router.replace("/login?next=/restaurant");
          return;
        }

        if (firstFailure.status === 403) {
          setStatus("forbidden");
          return;
        }

        setError(firstFailure.error);
        setStatus("error");
        return;
      }

      if (!profileResult.ok || !mealsResult.ok || !ordersResult.ok) {
        setError("Could not load restaurant dashboard.");
        setStatus("error");
        return;
      }

      setRestaurant(profileResult.restaurant);
      setMeals(mealsResult.meals);
      setOrders(ordersResult.orders);
      setStatus("ready");
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const ordersByStatus = useMemo(() => {
    const grouped = new Map<string, RestaurantOrderDto[]>();

    for (const order of orders) {
      const list = grouped.get(order.status) ?? [];
      list.push(order);
      grouped.set(order.status, list);
    }

    return STATUS_SECTION_ORDER.filter((statusKey) =>
      grouped.has(statusKey),
    ).map((statusKey) => ({
      status: statusKey,
      orders: grouped.get(statusKey) ?? [],
      isActive: ACTIVE_ORDER_STATUSES.has(statusKey),
    }));
  }, [orders]);

  const clearOrderError = (orderId: number) => {
    setOrderActionErrors((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });
  };

  const replaceOrder = (updated: RestaurantOrderDto) => {
    setOrders((current) =>
      current.map((order) => (order.id === updated.id ? updated : order)),
    );
  };

  const runOrderAction = async (
    orderId: number,
    action: () => Promise<
      | { ok: true; order: RestaurantOrderDto }
      | { ok: false; error: string }
    >,
  ) => {
    if (updatingOrderId !== null) {
      return;
    }

    setUpdatingOrderId(orderId);
    clearOrderError(orderId);

    try {
      const result = await action();

      if (!result.ok) {
        setOrderActionErrors((current) => ({
          ...current,
          [orderId]: result.error,
        }));
        return;
      }

      replaceOrder(result.order);
    } catch {
      setOrderActionErrors((current) => ({
        ...current,
        [orderId]: "Could not update the order.",
      }));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openCreateMeal = () => {
    setEditingMeal(null);
    setImagesText("");
    mealForm.reset(emptyMealForm());
    setShowMealForm(true);
    setActionError(null);
    setSuccess(null);
  };

  const openEditMeal = (meal: RestaurantMealDto) => {
    setEditingMeal(meal);
    setImagesText(meal.images.join("\n"));
    mealForm.reset({
      name: meal.name,
      description: meal.description ?? "",
      price: Number(meal.price),
      images: meal.images,
    });
    setShowMealForm(true);
    setActionError(null);
    setSuccess(null);
  };

  const onSubmitMeal = mealForm.handleSubmit(async (values) => {
    setActionError(null);
    setSuccess(null);

    const images = imagesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      name: values.name,
      description: values.description.trim() || null,
      price: values.price,
      images,
    };

    const result = editingMeal
      ? await updateRestaurantMeal(editingMeal.id, payload)
      : await createRestaurantMeal(payload);

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

      setActionError(result.error);
      return;
    }

    setMeals((current) => {
      if (editingMeal) {
        return current
          .map((meal) => (meal.id === result.meal.id ? result.meal : meal))
          .sort((left, right) => left.name.localeCompare(right.name));
      }

      return [...current, result.meal].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    });

    setShowMealForm(false);
    setEditingMeal(null);
    mealForm.reset(emptyMealForm());
    setImagesText("");
    setSuccess(
      editingMeal
        ? `${result.meal.name} was updated.`
        : `${result.meal.name} was added.`,
    );
  });

  const handleDeleteMeal = async () => {
    if (!pendingDeleteMeal || isDeletingMeal) {
      return;
    }

    setIsDeletingMeal(true);
    setActionError(null);

    try {
      const result = await deleteRestaurantMeal(pendingDeleteMeal.id);

      if (!result.ok) {
        setActionError(result.error);
        setPendingDeleteMeal(null);
        return;
      }

      setMeals((current) =>
        current.filter((meal) => meal.id !== pendingDeleteMeal.id),
      );
      setSuccess(`${pendingDeleteMeal.name} was deleted.`);
      setPendingDeleteMeal(null);
    } catch {
      setActionError("Could not delete the meal.");
      setPendingDeleteMeal(null);
    } finally {
      setIsDeletingMeal(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {status === "unauthenticated"
          ? "Redirecting to login..."
          : "Loading restaurant dashboard..."}
      </div>
    );
  }

  if (status === "forbidden") {
    return <RestaurantAccessDenied />;
  }

  if (status === "error" || !restaurant) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-700">
          {error ?? "Could not load restaurant dashboard."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {restaurant.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage your menu and kitchen order flow.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Restaurant details
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-zinc-500">Address</dt>
            <dd className="mt-0.5 text-zinc-900">{restaurant.address}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Cuisine</dt>
            <dd className="mt-0.5 text-zinc-900">
              {restaurant.restaurantTypes
                .map((type) => formatRestaurantType(type))
                .join(", ") || "Not set"}
            </dd>
          </div>
          {restaurant.description ? (
            <div className="sm:col-span-2">
              <dt className="font-medium text-zinc-500">Description</dt>
              <dd className="mt-0.5 text-zinc-900">{restaurant.description}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Menu
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Create, update, and remove meals for your restaurant.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateMeal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Add meal
          </button>
        </div>

        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {actionError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {actionError}
          </p>
        ) : null}

        {showMealForm ? (
          <form
            onSubmit={(event) => {
              void onSubmitMeal(event);
            }}
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h3 className="text-lg font-semibold text-zinc-900">
              {editingMeal ? "Edit meal" : "New meal"}
            </h3>
            <FormField
              label="Name"
              error={mealForm.formState.errors.name?.message}
            >
              <TextInput
                {...mealForm.register("name")}
                hasError={Boolean(mealForm.formState.errors.name)}
              />
            </FormField>
            <FormField
              label="Description"
              error={mealForm.formState.errors.description?.message}
            >
              <textarea
                {...mealForm.register("description")}
                rows={3}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 ${
                  mealForm.formState.errors.description
                    ? "border-red-400"
                    : "border-zinc-300"
                }`}
              />
            </FormField>
            <FormField
              label="Price"
              error={mealForm.formState.errors.price?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                min="0.01"
                {...mealForm.register("price", { valueAsNumber: true })}
                hasError={Boolean(mealForm.formState.errors.price)}
              />
            </FormField>
            <FormField
              label="Image URLs (one per line)"
              error={mealForm.formState.errors.images?.message}
            >
              <textarea
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                placeholder="https://example.com/meal.jpg"
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={mealForm.formState.isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mealForm.formState.isSubmitting
                  ? "Saving..."
                  : editingMeal
                    ? "Save changes"
                    : "Create meal"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMealForm(false);
                  setEditingMeal(null);
                  mealForm.reset(emptyMealForm());
                  setImagesText("");
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {meals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              No meals yet. Add your first menu item.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {meals.map((meal) => (
              <li
                key={meal.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">{meal.name}</p>
                  {meal.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {meal.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-medium text-orange-700">
                    {formatMealPrice(meal.price)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditMeal(meal)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteMeal(meal)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Orders
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Accept, prepare, and complete pickup orders for your kitchen.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No orders yet.</p>
          </div>
        ) : (
          ordersByStatus.map((group) => (
            <div key={group.status} className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
                {group.status.replaceAll("_", " ")}
                {group.isActive ? (
                  <span className="ml-2 text-sm font-medium text-orange-700">
                    ({group.orders.length})
                  </span>
                ) : null}
              </h3>
              <ul className="space-y-4">
                {group.orders.map((order) => (
                  <li key={order.id}>
                    <RestaurantOrderCard
                      order={order}
                      isUpdating={updatingOrderId === order.id}
                      error={orderActionErrors[order.id] ?? null}
                      onAccept={(orderId, estimatedDeliveryTime) => {
                        void runOrderAction(orderId, () =>
                          acceptRestaurantOrder(
                            orderId,
                            estimatedDeliveryTime,
                          ),
                        );
                      }}
                      onReject={(orderId) => {
                        void runOrderAction(orderId, () =>
                          rejectRestaurantOrder(orderId),
                        );
                      }}
                      onStartPreparing={(orderId) => {
                        void runOrderAction(orderId, () =>
                          updateRestaurantOrderStatus(orderId, "PREPARING"),
                        );
                      }}
                      onMarkReady={(orderId) => {
                        void runOrderAction(orderId, () =>
                          updateRestaurantOrderStatus(orderId, "READY"),
                        );
                      }}
                      onMarkPickedUp={(orderId) => {
                        void runOrderAction(orderId, () =>
                          updateRestaurantOrderStatus(orderId, "PICKED_UP"),
                        );
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <ConfirmDialog
        open={pendingDeleteMeal !== null}
        title="Delete meal?"
        description={
          pendingDeleteMeal
            ? `Delete "${pendingDeleteMeal.name}" from your menu? This cannot be undone.`
            : ""
        }
        confirmLabel={isDeletingMeal ? "Deleting..." : "Delete"}
        onConfirm={() => {
          void handleDeleteMeal();
        }}
        onCancel={() => setPendingDeleteMeal(null)}
      />
    </div>
  );
}
