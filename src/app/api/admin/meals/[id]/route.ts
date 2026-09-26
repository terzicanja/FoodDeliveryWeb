import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-request";

export async function DELETE() {
  const admin = await requireAdminAuth();

  if (!admin.ok) {
    return admin.response;
  }

  return NextResponse.json(
    { error: "Admins cannot delete meals" },
    { status: 403 },
  );
}
