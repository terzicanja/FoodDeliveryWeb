import { NextResponse } from "next/server";
import { requireCourierAuth } from "@/lib/auth-request";
import { acceptCourierOrder, CourierOrderError } from "@/lib/orders";

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

export async function POST(_request: Request, context: RouteContext) {
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

    const order = await acceptCourierOrder({
      orderId,
      courierId: courier.auth.userId,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof CourierOrderError) {
      if (error.code === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "ORDER_NOT_AVAILABLE") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("POST /api/courier/orders/[id]/accept failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
