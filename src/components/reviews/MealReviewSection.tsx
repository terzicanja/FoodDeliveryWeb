"use client";

import { useMemo, useState } from "react";
import { MealReviewsModal } from "@/components/reviews/MealReviewsModal";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";
import type { OwnReview, PublicReview, RatingSummary } from "@/lib/reviews";

type MealReviewSectionProps = {
  mealId: number;
  mealName: string;
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
    averageRating:
      Math.round(((previousTotal + addedRating) / nextCount) * 10) / 10,
    reviewCount: nextCount,
  };
}

export function MealReviewSection({
  mealId,
  mealName,
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
  const [modalOpen, setModalOpen] = useState(false);

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

  const hasRating = summary.reviewCount > 0 && summary.averageRating != null;

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg text-left text-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
      >
        {hasRating ? (
          <>
            <StarRating value={summary.averageRating!} />
            <span className="font-medium text-zinc-800">
              {summary.averageRating!.toFixed(1)}
            </span>
            <span className="font-medium text-orange-700 underline-offset-2 hover:underline">
              · {summary.reviewCount}{" "}
              {summary.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </>
        ) : (
          <span className="font-medium text-orange-700 underline-offset-2 hover:underline">
            View reviews
          </span>
        )}
      </button>

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
                setSummary((current) =>
                  nextRatingSummary(current, review.rating),
                );
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

      <MealReviewsModal
        open={modalOpen}
        mealName={mealName}
        rating={summary}
        reviews={serializedReviews}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
