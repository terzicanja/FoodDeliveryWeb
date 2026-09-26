import { NextResponse } from "next/server";
import { getOrdersForRestaurant } from "@/lib/restaurant";
import { requireRestaurantOwner } from "@/lib/restaurant-auth";

export async function GET() {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    const orders = await getOrdersForRestaurant(owner.restaurant.id);

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/restaurant/orders failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
