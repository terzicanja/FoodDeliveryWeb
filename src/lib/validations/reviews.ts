import { z } from "zod";

export const createReviewSchema = z.object({
  mealId: z
    .string()
    .trim()
    .regex(/^\d+$/, "Meal id must be a numeric string")
    .transform((value) => Number(value))
    .refine((value) => value > 0, "Meal id must be a positive number"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine(
      (value) => value === null || value.length <= 1000,
      "Comment must be at most 1000 characters",
    ),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewFormSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Select a rating from 1 to 5")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .optional(),
});

export type ReviewFormInput = z.infer<typeof reviewFormSchema>;
