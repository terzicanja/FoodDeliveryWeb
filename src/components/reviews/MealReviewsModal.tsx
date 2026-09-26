"use client";

import { ReviewList } from "@/components/reviews/ReviewList";
import { StarRating } from "@/components/reviews/StarRating";
import type { PublicReview, RatingSummary } from "@/lib/reviews";

type MealReviewsModalProps = {
  open: boolean;
  mealName: string;
  rating: RatingSummary;
  reviews: PublicReview[];
  onClose: () => void;
};

export function MealReviewsModal({
  open,
  mealName,
  rating,
  reviews,
  onClose,
}: MealReviewsModalProps) {
  if (!open) {
    return null;
  }

  const hasRating = rating.reviewCount > 0 && rating.averageRating != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-reviews-dialog-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-lg sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="meal-reviews-dialog-title"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              {mealName}
            </h2>
            {hasRating ? (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                <StarRating value={rating.averageRating!} />
                <span className="font-medium text-zinc-800">
                  {rating.averageRating!.toFixed(1)}
                </span>
                <span className="text-zinc-500">
                  · {rating.reviewCount}{" "}
                  {rating.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No reviews yet</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              There are no reviews for this meal yet.
            </p>
          ) : (
            <ReviewList reviews={reviews} />
          )}
        </div>
      </div>
    </div>
  );
}
