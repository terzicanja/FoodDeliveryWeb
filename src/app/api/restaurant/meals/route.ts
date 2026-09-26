import { NextResponse } from "next/server";
import {
  createMealForRestaurant,
  getMealsForRestaurant,
  RestaurantActionError,
} from "@/lib/restaurant";
import { requireRestaurantOwner } from "@/lib/restaurant-auth";
import { createMealSchema } from "@/lib/validations/restaurant";

export async function GET() {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    const meals = await getMealsForRestaurant(owner.restaurant.id);

    return NextResponse.json({ meals }, { status: 200 });
  } catch (error) {
    console.error("GET /api/restaurant/meals failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createMealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const meal = await createMealForRestaurant({
      restaurantId: owner.restaurant.id,
      input: parsed.data,
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/restaurant/meals failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
