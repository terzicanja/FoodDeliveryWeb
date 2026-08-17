import { NextResponse } from "next/server";
import { requireCourierAuth } from "@/lib/auth-request";
import { getOrdersForCourier } from "@/lib/orders";

export async function GET() {
  try {
    const courier = await requireCourierAuth();

    if (!courier.ok) {
      return courier.response;
    }

    const orders = await getOrdersForCourier(courier.auth.userId);

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET /api/courier/orders failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
