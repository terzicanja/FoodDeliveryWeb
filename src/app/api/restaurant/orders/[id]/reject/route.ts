import { NextResponse } from "next/server";
import {
  rejectRestaurantOrder,
  RestaurantActionError,
} from "@/lib/restaurant";
import {
  parsePositiveId,
  requireRestaurantOwner,
} from "@/lib/restaurant-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

    const order = await rejectRestaurantOrder({
      restaurantId: owner.restaurant.id,
      orderId,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/restaurant/orders/[id]/reject failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
