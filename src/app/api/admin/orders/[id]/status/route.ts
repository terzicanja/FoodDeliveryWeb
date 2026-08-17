import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-request";
import { updateOrderStatus, UpdateOrderStatusError } from "@/lib/orders";
import { updateOrderStatusSchema } from "@/lib/validations/orders";

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
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
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

    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await updateOrderStatus({
      orderId,
      nextStatus: parsed.data.status,
      actorRole: admin.auth.role,
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    if (error instanceof UpdateOrderStatusError) {
      if (error.code === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "INVALID_TRANSITION") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("PATCH /api/admin/orders/[id]/status failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
