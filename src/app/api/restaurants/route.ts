import { NextResponse } from "next/server";
import { getRestaurants } from "@/lib/restaurants";

export async function GET() {
  try {
    const restaurants = await getRestaurants();

    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    console.error("GET /api/restaurants failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
