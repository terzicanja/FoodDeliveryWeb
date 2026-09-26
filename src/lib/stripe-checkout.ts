import "server-only";
import { PaymentMethod, type Prisma } from "@prisma/client";
import { resolveOrderItems } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import type { CreateOrderInput } from "@/lib/validations/orders";

const STRIPE_METADATA_VALUE_MAX_LENGTH = 500;
const STRIPE_CURRENCY = "eur";

export class StripeCheckoutError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "StripeCheckoutError";
    this.statusCode = statusCode;
  }
}

type CreateCardCheckoutSessionParams = {
  userId: number;
  restaurantId: number;
  deliveryAddress: string;
  fulfillmentType: CreateOrderInput["fulfillmentType"];
  note: CreateOrderInput["note"];
  items: CreateOrderInput["items"];
};

function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;

  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Add it to your .env file before using Stripe Checkout.",
    );
  }

  return raw.replace(/\/$/, "");
}

function toStripeUnitAmount(price: Prisma.Decimal): number {
  const cents = price.mul(100);

  if (!cents.isInteger()) {
    throw new Error("Meal price must have at most two decimal places");
  }

  const amount = cents.toNumber();

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Meal price is invalid for Stripe Checkout");
  }

  return amount;
}

function serializeCheckoutItemsMetadata(
  items: Array<{ mealId: number; quantity: number }>,
): string {
  const serialized = JSON.stringify(
    items.map((item) => ({
      mealId: item.mealId,
      quantity: item.quantity,
    })),
  );

  if (serialized.length > STRIPE_METADATA_VALUE_MAX_LENGTH) {
    throw new StripeCheckoutError(
      400,
      "Cart is too large for card checkout. Reduce the number of items and try again.",
    );
  }

  return serialized;
}

/**
 * Create a hosted Stripe Checkout Session for an online CARD payment.
 * Line items and amounts are derived from database meal prices.
 */
export async function createCardCheckoutSession(
  params: CreateCardCheckoutSessionParams,
): Promise<{ url: string }> {
  const resolved = await resolveOrderItems({
    restaurantId: params.restaurantId,
    items: params.items,
  });
  const baseUrl = getAppBaseUrl();
  const itemsMetadata = serializeCheckoutItemsMetadata(resolved.items);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "hosted_page",
    line_items: resolved.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: STRIPE_CURRENCY,
        unit_amount: toStripeUnitAmount(item.unitPrice),
        product_data: {
          name: item.name,
        },
      },
    })),
    success_url: `${baseUrl}/checkout/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/stripe/cancel`,
    metadata: {
      userId: String(params.userId),
      restaurantId: String(resolved.restaurantId),
      fulfillmentType: params.fulfillmentType,
      deliveryAddress: params.deliveryAddress,
      note: params.note ?? "",
      paymentMethod: PaymentMethod.CARD,
      items: itemsMetadata,
    },
  });

  if (!session.url) {
    throw new Error("Stripe Checkout Session did not return a redirect URL");
  }

  return { url: session.url };
}
