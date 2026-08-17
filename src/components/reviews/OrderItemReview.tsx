"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";
import type { OwnReviewDto } from "@/lib/api/reviews-client";

type OrderItemReviewProps = {
  mealId: number;
  existingReview: OwnReviewDto | null;
  onReviewCreated: (review: OwnReviewDto) => void;
};

export function OrderItemReview({
  mealId,
  existingReview,
  onReviewCreated,
}: OrderItemReviewProps) {
  const [formOpen, setFormOpen] = useState(false);

  if (existingReview) {
    return (
      <div className="mt-1">
        <p className="flex items-center gap-2 text-sm text-zinc-600">
          <StarRating value={existingReview.rating} />
          <span>Your review</span>
        </p>
        {existingReview.comment ? (
          <p className="mt-1 text-sm text-zinc-500">{existingReview.comment}</p>
        ) : null}
      </div>
    );
  }

  if (formOpen) {
    return (
      <div className="mt-3 w-full">
        <ReviewForm
          mealId={mealId}
          onCreated={(review) => {
            onReviewCreated({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt:
                review.createdAt instanceof Date
                  ? review.createdAt.toISOString()
                  : String(review.createdAt),
            });
            setFormOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setFormOpen(true);
      }}
      className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
    >
      Write a review
    </button>
  );
}
