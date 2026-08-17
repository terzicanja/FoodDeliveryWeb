import { RestaurantType } from "@prisma/client";
import { z } from "zod";

const restaurantTypeValues = Object.values(RestaurantType) as [
  RestaurantType,
  ...RestaurantType[],
];

const restaurantTypeSchema = z.enum(restaurantTypeValues);

const optionalDescription = z
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
    "Description must be at most 1000 characters",
  );

export const createRestaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  description: optionalDescription,
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(255, "Address must be at most 255 characters"),
  restaurantTypes: z
    .array(restaurantTypeSchema)
    .min(1, "Select at least one restaurant type")
    .transform((types) => [...new Set(types)]),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;

export const restaurantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(255, "Address must be at most 255 characters"),
  restaurantTypes: z
    .array(restaurantTypeSchema)
    .min(1, "Select at least one restaurant type"),
});

export type RestaurantFormInput = z.infer<typeof restaurantFormSchema>;

const imageUrlListSchema = z
  .array(z.string())
  .transform((urls) =>
    urls.map((url) => url.trim()).filter((url) => url.length > 0),
  )
  .pipe(
    z.array(z.string().url("Each image must be a valid URL")).max(
      10,
      "A meal can have at most 10 images",
    ),
  );

export const createMealSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  description: optionalDescription,
  price: z.coerce
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(9999.99, "Price must be at most 9999.99"),
  images: imageUrlListSchema.default([]),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;

export const mealFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters"),
  price: z
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(9999.99, "Price must be at most 9999.99"),
  images: z.array(z.string()),
});

export type MealFormInput = z.infer<typeof mealFormSchema>;
