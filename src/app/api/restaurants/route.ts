import { NextResponse } from "next/server";
import { getRestaurants } from "@/lib/restaurants";
import { parseRestaurantQuery } from "@/lib/validations/restaurants";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseRestaurantQuery({
      search: url.searchParams.get("search"),
      type: url.searchParams.get("type"),
      sort: url.searchParams.get("sort"),
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
    });

    const restaurants = await getRestaurants({
      search: query.search,
      restaurantType: query.type,
      sort: query.sort,
      origin: query.origin,
    });

    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    console.error("GET /api/restaurants failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
