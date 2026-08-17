import { NextResponse } from "next/server";
import {
  AdminActionError,
  deleteMealForAdmin,
  parsePositiveId,
} from "@/lib/admin";
import { requireAdminAuth } from "@/lib/auth-request";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminAuth();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await context.params;
    const mealId = parsePositiveId(id);

    if (mealId === null) {
      return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
    }

    await deleteMealForAdmin(mealId);

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("DELETE /api/admin/meals/[id] failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
