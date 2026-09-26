import { NextResponse } from "next/server";
import {
  AdminActionError,
  getMealsForRestaurantAdmin,
  parsePositiveId,
} from "@/lib/admin";
import { requireAdminAuth } from "@/lib/auth-request";

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

export async function POST() {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    return NextResponse.json(
      { error: "Admins cannot create or edit meals" },
      { status: 403 },
    );
  } catch (error) {
    console.error("POST /api/admin/restaurants/[id]/meals failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
