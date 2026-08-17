import { StarRating } from "@/components/reviews/StarRating";
import type { RatingSummary } from "@/lib/reviews";

type RatingSummaryDisplayProps = RatingSummary & {
  className?: string;
};

export function RatingSummaryDisplay({
  averageRating,
  reviewCount,
  className = "",
}: RatingSummaryDisplayProps) {
  if (reviewCount === 0 || averageRating == null) {
    return (
      <p className={`text-sm text-zinc-500 ${className}`}>No reviews yet</p>
    );
  }

  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-sm ${className}`}>
      <StarRating value={averageRating} />
      <span className="font-medium text-zinc-800">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-zinc-500">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </p>
  );
}
