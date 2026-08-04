import { z } from "zod";

const orderItemSchema = z.object({
  mealId: z
    .string()
    .trim()
    .regex(/^\d+$/, "Meal id must be a numeric string")
    .transform((value) => Number(value))
    .refine((value) => value > 0, "Meal id must be a positive number"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .max(99, "Quantity must be at most 99"),
});

export const createOrderSchema = z.object({
  deliveryAddress: z
    .string()
    .trim()
    .min(1, "Delivery address is required")
    .max(255, "Delivery address must be at most 255 characters"),
  paymentMethod: z.literal("CASH"),
  items: z
    .array(orderItemSchema)
    .min(1, "Order must include at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
