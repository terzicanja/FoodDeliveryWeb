import { NextResponse } from "next/server";
import {
  deleteMealForRestaurant,
  RestaurantActionError,
  updateMealForRestaurant,
} from "@/lib/restaurant";
import {
  parsePositiveId,
  requireRestaurantOwner,
} from "@/lib/restaurant-auth";
import { updateMealSchema } from "@/lib/validations/restaurant";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    const { id } = await context.params;
    const mealId = parsePositiveId(id);

    if (mealId === null) {
      return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateMealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const meal = await updateMealForRestaurant({
      restaurantId: owner.restaurant.id,
      mealId,
      input: parsed.data,
    });

    return NextResponse.json({ meal }, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("PATCH /api/restaurant/meals/[id] failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    const { id } = await context.params;
    const mealId = parsePositiveId(id);

    if (mealId === null) {
      return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
    }

    await deleteMealForRestaurant({
      restaurantId: owner.restaurant.id,
      mealId,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("DELETE /api/restaurant/meals/[id] failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
