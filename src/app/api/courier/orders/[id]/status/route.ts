import { NextResponse } from "next/server";
import { requireCourierAuth } from "@/lib/auth-request";
import { CourierOrderError, deliverCourierOrder } from "@/lib/orders";
import { courierDeliverOrderSchema } from "@/lib/validations/orders";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseOrderId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const courier = await requireCourierAuth();

    if (!courier.ok) {
      return courier.response;
    }

    const { id } = await context.params;
    const orderId = parseOrderId(id);

    if (orderId === null) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = courierDeliverOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await deliverCourierOrder({
      orderId,
      courierId: courier.auth.userId,
      nextStatus: parsed.data.status,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof CourierOrderError) {
      if (error.code === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "INVALID_TRANSITION") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("PATCH /api/courier/orders/[id]/status failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
