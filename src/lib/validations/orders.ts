import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
} from "@prisma/client";
import { z } from "zod";

const fulfillmentTypeValues = Object.values(FulfillmentType) as [
  FulfillmentType,
  ...FulfillmentType[],
];

const paymentMethodValues = Object.values(PaymentMethod) as [
  PaymentMethod,
  ...PaymentMethod[],
];

const orderStatusValues = Object.values(OrderStatus) as [
  OrderStatus,
  ...OrderStatus[],
];

export const ORDER_NOTE_MAX_LENGTH = 500;

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

const optionalOrderNote = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  .refine(
    (value) => value === null || value.length <= ORDER_NOTE_MAX_LENGTH,
    `Note must be at most ${ORDER_NOTE_MAX_LENGTH} characters`,
  );

export const createOrderSchema = z.object({
  restaurantId: z
    .number({ error: "Restaurant id must be a number" })
    .int("Restaurant id must be an integer")
    .positive("Restaurant id must be a positive number"),
  deliveryAddress: z
    .string()
    .trim()
    .min(1, "Delivery address is required")
    .max(255, "Delivery address must be at most 255 characters"),
  fulfillmentType: z.enum(fulfillmentTypeValues),
  paymentMethod: z.enum(paymentMethodValues),
  note: optionalOrderNote,
  items: z
    .array(orderItemSchema)
    .min(1, "Order must include at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const positiveIdFromString = z
  .string()
  .trim()
  .regex(/^\d+$/, "Id must be a numeric string")
  .transform((value) => Number(value))
  .refine((value) => value > 0, "Id must be a positive number");

/**
 * Validate Stripe Checkout Session metadata before creating a paid CARD order.
 * Item meal IDs in metadata may be JSON numbers; they are normalized to the
 * same shape as createOrderSchema.
 */
export function parseStripeCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
) {
  if (!metadata) {
    return { success: false as const };
  }

  const userIdResult = positiveIdFromString.safeParse(metadata.userId);

  if (!userIdResult.success) {
    return { success: false as const };
  }

  let rawItems: unknown;

  try {
    rawItems = JSON.parse(metadata.items ?? "");
  } catch {
    return { success: false as const };
  }

  if (!Array.isArray(rawItems)) {
    return { success: false as const };
  }

  const items = rawItems.map((item) => {
    if (typeof item !== "object" || item === null) {
      return item;
    }

    const record = item as Record<string, unknown>;

    return {
      mealId: record.mealId == null ? record.mealId : String(record.mealId),
      quantity: record.quantity,
    };
  });

  const orderResult = createOrderSchema.safeParse({
    restaurantId: Number(metadata.restaurantId),
    deliveryAddress: metadata.deliveryAddress,
    fulfillmentType: metadata.fulfillmentType,
    paymentMethod: metadata.paymentMethod,
    note: metadata.note,
    items,
  });

  if (!orderResult.success) {
    return { success: false as const };
  }

  if (orderResult.data.paymentMethod !== PaymentMethod.CARD) {
    return { success: false as const };
  }

  return {
    success: true as const,
    data: {
      userId: userIdResult.data,
      ...orderResult.data,
    },
  };
}

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

const requiredFailureNote = z
  .string({ error: "Failure note is required" })
  .trim()
  .min(1, "Failure note is required")
  .max(
    ORDER_NOTE_MAX_LENGTH,
    `Failure note must be at most ${ORDER_NOTE_MAX_LENGTH} characters`,
  );

export const courierDeliverOrderSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("DELIVERED"),
  }),
  z.object({
    status: z.literal("FAILED"),
    failureNote: requiredFailureNote,
  }),
]);

export type CourierDeliverOrderInput = z.infer<typeof courierDeliverOrderSchema>;
