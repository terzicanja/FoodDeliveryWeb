import { NextResponse } from "next/server";
import {
  AdminActionError,
  createMealForRestaurantAdmin,
  getMealsForRestaurantAdmin,
  parsePositiveId,
} from "@/lib/admin";
import { requireAdminAuth } from "@/lib/auth-request";
import { createMealSchema } from "@/lib/validations/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await context.params;
    const restaurantId = parsePositiveId(id);

    if (restaurantId === null) {
      return NextResponse.json(
        { error: "Invalid restaurant id" },
        { status: 400 },
      );
    }

    const meals = await getMealsForRestaurantAdmin(restaurantId);

    return NextResponse.json({ meals }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("GET /api/admin/restaurants/[id]/meals failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await context.params;
    const restaurantId = parsePositiveId(id);

    if (restaurantId === null) {
      return NextResponse.json(
        { error: "Invalid restaurant id" },
        { status: 400 },
      );
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

    const meal = await createMealForRestaurantAdmin({
      restaurantId,
      input: parsed.data,
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/admin/restaurants/[id]/meals failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
