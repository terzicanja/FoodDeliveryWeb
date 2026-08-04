import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth-request";
import {
  createOrder,
  CreateOrderError,
  getOrdersForUser,
} from "@/lib/orders";
import { createOrderSchema } from "@/lib/validations/orders";

export async function GET() {
  try {
    const auth = await getAuthPayload();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const orders = await getOrdersForUser(auth.userId);

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthPayload();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { deliveryAddress, paymentMethod, items } = parsed.data;

    const order = await createOrder({
      userId: auth.userId,
      deliveryAddress,
      paymentMethod,
      items,
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          status: order.status,
          totalPrice: order.totalPrice,
          createdAt: order.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CreateOrderError) {
      if (error.code === "MEAL_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "DIFFERENT_RESTAURANTS") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("POST /api/orders failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
