import "server-only";
import Stripe from "stripe";
import { findPaidCardOrderForCheckoutSession, type CreatedOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

const ORDER_LOOKUP_ATTEMPTS = 5;
const ORDER_LOOKUP_DELAY_MS = 500;

export type StripeCheckoutSuccessResult =
  | { status: "invalid_session" }
  | { status: "unpaid" }
  | { status: "pending_order" }
  | { status: "unavailable" }
  | { status: "error" }
  | { status: "confirmed"; order: CreatedOrder };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Confirm a returning Stripe Checkout Session as paid, then find the
 * matching database Order for this customer. session_id is not proof of payment.
 */
export async function confirmStripeCheckoutSuccess(params: {
  sessionId: string;
  userId: number;
}): Promise<StripeCheckoutSuccessResult> {
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(params.sessionId);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return { status: "invalid_session" };
    }

    console.error("confirmStripeCheckoutSuccess session retrieve failed");
    return { status: "error" };
  }

  if (session.payment_status !== "paid") {
    return { status: "unpaid" };
  }

  for (let attempt = 1; attempt <= ORDER_LOOKUP_ATTEMPTS; attempt += 1) {
    const lookup = await findPaidCardOrderForCheckoutSession({
      checkoutSessionId: session.id,
      userId: params.userId,
    });

    if (lookup.status === "found") {
      return { status: "confirmed", order: lookup.order };
    }

    if (lookup.status === "unavailable") {
      return { status: "unavailable" };
    }

    if (attempt < ORDER_LOOKUP_ATTEMPTS) {
      await sleep(ORDER_LOOKUP_DELAY_MS);
    }
  }

  return { status: "pending_order" };
}
