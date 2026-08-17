import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-request";
import { getAllOrdersForAdmin } from "@/lib/orders";

export async function GET() {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const orders = await getAllOrdersForAdmin();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
