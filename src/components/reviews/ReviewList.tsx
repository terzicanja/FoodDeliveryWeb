import { StarRating } from "@/components/reviews/StarRating";
import { formatOrderDate } from "@/lib/format";
import type { PublicReview } from "@/lib/reviews";

type ReviewListProps = {
  reviews: PublicReview[];
};

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-900">
              {review.reviewer.firstName}
            </p>
            <p className="text-xs text-zinc-500">
              {formatOrderDate(review.createdAt)}
            </p>
          </div>
          <div className="mt-1">
            <StarRating value={review.rating} />
          </div>
          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {review.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
