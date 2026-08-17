import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-request";
import { getUsersForAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const users = await getUsersForAdmin(admin.auth.userId);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/users failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
