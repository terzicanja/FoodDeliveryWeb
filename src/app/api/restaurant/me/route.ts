import { NextResponse } from "next/server";
import { requireRestaurantOwner } from "@/lib/restaurant-auth";

export async function GET() {
  try {
    const owner = await requireRestaurantOwner();

    if (!owner.ok) {
      return owner.response;
    }

    return NextResponse.json({ restaurant: owner.restaurant }, { status: 200 });
  } catch (error) {
    console.error("GET /api/restaurant/me failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
