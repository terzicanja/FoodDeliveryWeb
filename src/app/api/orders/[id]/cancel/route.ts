import { NextResponse } from "next/server";
import { parsePositiveId } from "@/lib/admin";
import { requireCustomerAuth } from "@/lib/auth-request";
import { CancelOrderError, cancelOrderForCustomer } from "@/lib/orders";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const customer = await requireCustomerAuth();

    if (!customer.ok) {
      return customer.response;
    }

    const { id } = await context.params;
    const orderId = parsePositiveId(id);

    if (orderId === null) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const order = await cancelOrderForCustomer({
      orderId,
      userId: customer.auth.userId,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof CancelOrderError) {
      if (error.code === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "INVALID_TRANSITION") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("POST /api/orders/[id]/cancel failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
