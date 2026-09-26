import "server-only";
import type Stripe from "stripe";
import {
  createPaidCardOrderForCheckoutSession,
  CreateOrderError,
} from "@/lib/orders";
import { parseStripeCheckoutMetadata } from "@/lib/validations/orders";

export class StripeWebhookError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "StripeWebhookError";
    this.statusCode = statusCode;
  }
}

/**
 * Process a verified Stripe webhook event.
 * Only paid Checkout Sessions create an Order.
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  if (event.type !== "checkout.session.completed") {
    return;
  }

  const session = event.data.object;

  if (session.payment_status !== "paid") {
    return;
  }

  const parsed = parseStripeCheckoutMetadata(session.metadata);

  if (!parsed.success) {
    console.error("POST /api/webhooks/stripe invalid metadata", {
      sessionId: session.id,
    });
    throw new StripeWebhookError(400, "Invalid checkout metadata");
  }

  try {
    await createPaidCardOrderForCheckoutSession({
      checkoutSessionId: session.id,
      userId: parsed.data.userId,
      restaurantId: parsed.data.restaurantId,
      deliveryAddress: parsed.data.deliveryAddress,
      fulfillmentType: parsed.data.fulfillmentType,
      note: parsed.data.note,
      items: parsed.data.items,
    });
  } catch (error) {
    if (error instanceof CreateOrderError) {
      console.error("POST /api/webhooks/stripe order creation rejected", {
        sessionId: session.id,
        code: error.code,
      });
      throw new StripeWebhookError(400, "Order could not be created");
    }

    throw error;
  }
}
