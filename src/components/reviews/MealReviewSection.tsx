"use client";

import { useMemo, useState } from "react";
import { RatingSummaryDisplay } from "@/components/reviews/RatingSummary";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import type { OwnReview, PublicReview, RatingSummary } from "@/lib/reviews";

type MealReviewSectionProps = {
  mealId: number;
  rating: RatingSummary;
  reviews: PublicReview[];
  canReview: boolean;
  ownReview: OwnReview | null;
};

function nextRatingSummary(
  current: RatingSummary,
  addedRating: number,
): RatingSummary {
  const nextCount = current.reviewCount + 1;
  const previousTotal = (current.averageRating ?? 0) * current.reviewCount;

  return {
    averageRating: Math.round(((previousTotal + addedRating) / nextCount) * 10) / 10,
    reviewCount: nextCount,
  };
}

export function MealReviewSection({
  mealId,
  rating,
  reviews,
  canReview,
  ownReview,
}: MealReviewSectionProps) {
  const [summary, setSummary] = useState(rating);
  const [reviewList, setReviewList] = useState(reviews);
  const [eligible, setEligible] = useState(canReview);
  const [mine, setMine] = useState(ownReview);
  const [formOpen, setFormOpen] = useState(false);

  const serializedReviews = useMemo(
    () =>
      reviewList.map((review) => ({
        ...review,
        createdAt:
          review.createdAt instanceof Date
            ? review.createdAt
            : new Date(review.createdAt),
      })),
    [reviewList],
  );

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <RatingSummaryDisplay
        averageRating={summary.averageRating}
        reviewCount={summary.reviewCount}
      />

      {mine ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
          <StarRating value={mine.rating} />
          <span>Your review</span>
        </p>
      ) : null}

      {eligible ? (
        <div className="mt-3">
          {formOpen ? (
            <ReviewForm
              mealId={mealId}
              onCreated={(review) => {
                setReviewList((current) => [review, ...current]);
                setSummary((current) => nextRatingSummary(current, review.rating));
                setMine({
                  id: review.id,
                  rating: review.rating,
                  comment: review.comment,
                  createdAt: review.createdAt,
                });
                setEligible(false);
                setFormOpen(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setFormOpen(true);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              Write a review
            </button>
          )}
        </div>
      ) : null}

      {serializedReviews.length > 0 ? (
        <div className="mt-4">
          <ReviewList reviews={serializedReviews} />
        </div>
      ) : null}
    </div>
  );
}
