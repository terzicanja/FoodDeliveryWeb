"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/auth/FormField";
import { createReviewRequest } from "@/lib/api/reviews-client";
import type { PublicReview } from "@/lib/reviews";
import {
  reviewFormSchema,
  type ReviewFormInput,
} from "@/lib/validations/reviews";

type ReviewFormProps = {
  mealId: number;
  onCreated: (review: PublicReview) => void;
};

function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const selected = rating <= value;

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => {
              onChange(rating);
            }}
            className="rounded-md p-0.5 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={`h-7 w-7 ${selected ? "text-orange-500" : "text-zinc-200"}`}
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function ReviewForm({ mealId, onCreated }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const rating = watch("rating");

  const onSubmit = handleSubmit(async (values) => {
    const result = await createReviewRequest({
      mealId: String(mealId),
      rating: values.rating,
      comment: values.comment,
    });

    if (!result.ok) {
      if (result.details) {
        for (const [field, messages] of Object.entries(result.details)) {
          if (
            messages?.[0] &&
            (field === "rating" || field === "comment")
          ) {
            setError(field, { message: messages[0] });
          }
        }
      }

      setError("root", {
        message: result.error,
      });
      return;
    }

    onCreated({
      ...result.review,
      createdAt: new Date(result.review.createdAt),
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {errors.root?.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      ) : null}

      <FormField label="Your rating" error={errors.rating?.message}>
        <StarInput
          value={Number(rating) || 0}
          disabled={isSubmitting}
          onChange={(nextRating) => {
            setValue("rating", nextRating, { shouldValidate: true });
          }}
        />
      </FormField>

      <FormField label="Comment (optional)" error={errors.comment?.message}>
        <textarea
          rows={3}
          maxLength={1000}
          placeholder="What did you think?"
          disabled={isSubmitting}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 ${
            errors.comment ? "border-red-400" : "border-zinc-300"
          }`}
          {...register("comment")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
