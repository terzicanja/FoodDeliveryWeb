import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  RestaurantActionError,
  updateRestaurantOrderStatus,
} from "@/lib/restaurant";
import {
  parsePositiveId,
  requireRestaurantOwner,
} from "@/lib/restaurant-auth";
import { restaurantOrderStatusSchema } from "@/lib/validations/restaurant";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_MAP = {
  PREPARING: OrderStatus.PREPARING,
  READY: OrderStatus.READY,
  PICKED_UP: OrderStatus.PICKED_UP,
} as const;

export async function PATCH(request: Request, context: RouteContext) {
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

    const parsed = restaurantOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await updateRestaurantOrderStatus({
      restaurantId: owner.restaurant.id,
      orderId,
      nextStatus: STATUS_MAP[parsed.data.status],
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof RestaurantActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("PATCH /api/restaurant/orders/[id]/status failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
