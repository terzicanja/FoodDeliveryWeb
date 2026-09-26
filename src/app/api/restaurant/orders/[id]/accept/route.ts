import { NextResponse } from "next/server";
import {
  acceptRestaurantOrder,
  RestaurantActionError,
} from "@/lib/restaurant";
import {
  parsePositiveId,
  requireRestaurantOwner,
} from "@/lib/restaurant-auth";
import { acceptRestaurantOrderSchema } from "@/lib/validations/restaurant";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    const { id } = await context.params;
    const orderId = parsePositiveId(id);

    if (orderId === null) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = acceptRestaurantOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await acceptRestaurantOrder({
      restaurantId: owner.restaurant.id,
      orderId,
      input: parsed.data,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/restaurant/orders/[id]/accept failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
