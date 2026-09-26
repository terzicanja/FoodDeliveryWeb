import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-request";

export async function PATCH() {
  const admin = await requireAdminAuth();

  if (!admin.ok) {
    return admin.response;
  }

  return NextResponse.json(
    { error: "Admins cannot change order statuses" },
    { status: 403 },
  );
}
