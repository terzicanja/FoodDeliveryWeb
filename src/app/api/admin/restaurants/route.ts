import { NextResponse } from "next/server";
import {
  AdminActionError,
  createRestaurantForAdmin,
  getRestaurantsForAdmin,
} from "@/lib/admin";
import { requireAdminAuth } from "@/lib/auth-request";
import { createRestaurantSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const restaurants = await getRestaurantsForAdmin();

    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/restaurants failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createRestaurantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const restaurant = await createRestaurantForAdmin(parsed.data);

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/admin/restaurants failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
