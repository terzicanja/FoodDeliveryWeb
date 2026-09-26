import { z } from "zod";
import {
  createMealSchema,
  mealFormSchema,
  type CreateMealInput,
  type MealFormInput,
} from "@/lib/validations/admin";

export const DEFAULT_ACCEPT_ETA_MINUTES = 40;
export const MIN_ACCEPT_ETA_MINUTES = 5;
export const MAX_ACCEPT_ETA_MINUTES = 240;

export {
  createMealSchema,
  mealFormSchema,
  type CreateMealInput,
  type MealFormInput,
};

export const updateMealSchema = createMealSchema;
export type UpdateMealInput = CreateMealInput;

export const acceptRestaurantOrderSchema = z.object({
  estimatedDeliveryTime: z.coerce
    .number({ error: "Estimated time must be a number" })
    .int("Estimated time must be a whole number of minutes")
    .min(
      MIN_ACCEPT_ETA_MINUTES,
      `Estimated time must be at least ${MIN_ACCEPT_ETA_MINUTES} minutes`,
    )
    .max(
      MAX_ACCEPT_ETA_MINUTES,
      `Estimated time must be at most ${MAX_ACCEPT_ETA_MINUTES} minutes`,
    ),
});

export type AcceptRestaurantOrderInput = z.infer<
  typeof acceptRestaurantOrderSchema
>;

export const restaurantOrderStatusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "PICKED_UP"]),
});

export type RestaurantOrderStatusInput = z.infer<
  typeof restaurantOrderStatusSchema
>;
