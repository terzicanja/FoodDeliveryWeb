import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth-request";
import { prisma } from "@/lib/prisma";
import { userPublicSelect } from "@/lib/user";

export async function GET() {
  try {
    const auth = await getAuthPayload();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: userPublicSelect,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
