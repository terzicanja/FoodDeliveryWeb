import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireCustomerAuth } from "@/lib/auth-request";
import { CreateOrderError } from "@/lib/orders";
import {
  createCardCheckoutSession,
  StripeCheckoutError,
} from "@/lib/stripe-checkout";
import { createOrderSchema } from "@/lib/validations/orders";

export async function POST(request: Request) {
  try {
    const customer = await requireCustomerAuth();

    if (!customer.ok) {
      return customer.response;
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

    const {
      restaurantId,
      deliveryAddress,
      fulfillmentType,
      paymentMethod,
      note,
      items,
    } = parsed.data;

    if (paymentMethod !== PaymentMethod.CARD) {
      return NextResponse.json(
        { error: "Stripe Checkout only accepts CARD payments" },
        { status: 400 },
      );
    }

    const session = await createCardCheckoutSession({
      userId: customer.auth.userId,
      restaurantId,
      deliveryAddress,
      fulfillmentType,
      note,
      items,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof StripeCheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof CreateOrderError) {
      if (error.code === "MEAL_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "DIFFERENT_RESTAURANTS") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("POST /api/checkout/stripe failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
