import { NextResponse } from "next/server";
import { getMealReviewsPayload } from "@/lib/reviews";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseMealId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mealId = parseMealId(id);

    if (mealId === null) {
      return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
    }

    const payload = await getMealReviewsPayload(mealId);

    if (!payload) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        averageRating: payload.rating.averageRating,
        reviewCount: payload.rating.reviewCount,
        reviews: payload.reviews,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/meals/[id]/reviews failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
