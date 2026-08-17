import { parseApiError } from "@/lib/api/auth-client";

export type PublicReviewDto = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  mealId: number;
  reviewer: {
    firstName: string;
  };
};

export type MealReviewsResponse = {
  averageRating: number | null;
  reviewCount: number;
  reviews: PublicReviewDto[];
};

export type OwnReviewDto = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export async function fetchMealReviews(mealId: number) {
  const response = await fetch(`/api/meals/${mealId}/reviews`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not load reviews.",
    };
  }

  const body = (await response.json()) as MealReviewsResponse;

  return {
    ok: true as const,
    ...body,
  };
}

export async function createReviewRequest(payload: {
  mealId: string;
  rating: number;
  comment?: string;
}) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await parseApiError(response);
    return {
      ok: false as const,
      status: response.status,
      error: errorBody.error ?? "Could not submit your review.",
      details: errorBody.details,
    };
  }

  const body = (await response.json()) as { review: PublicReviewDto };

  return {
    ok: true as const,
    review: body.review,
  };
}
