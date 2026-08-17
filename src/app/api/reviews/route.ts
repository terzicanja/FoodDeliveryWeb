import { NextResponse } from "next/server";
import { requireCustomerAuth } from "@/lib/auth-request";
import { createReview, CreateReviewError } from "@/lib/reviews";
import { createReviewSchema } from "@/lib/validations/reviews";

export async function POST(request: Request) {
  try {
    const customer = await requireCustomerAuth();

    if (!customer.ok) {
      return customer.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const review = await createReview({
      userId: customer.auth.userId,
      input: parsed.data,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof CreateReviewError) {
      if (error.code === "MEAL_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.code === "NOT_ELIGIBLE") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      if (error.code === "ALREADY_REVIEWED") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("POST /api/reviews failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
